import * as k8s from "@kubernetes/client-node";
import { ReshardingSpec } from "./types";

const NAMESPACE = "es-config";
const GROUP = "front.search.com";
const VERSION = "v1";
const PLURAL = "reshardings";

// Load in-cluster config
const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

interface ReshardingItem {
  metadata: {
    name: string;
  };
  spec: ReshardingSpec;
}

interface ReshardingList {
  items: ReshardingItem[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reshard(
  sourceIndex: string,
  targetIndex: string,
): Promise<void> {
  console.log(`Resharding from ${sourceIndex} to ${targetIndex}`);
  await sleep(5000); // Simulate resharding process
}

async function createNewIndex(
  sourceTarget: string,
  targetIndex: string,
): Promise<void> {
  console.log(`Creating new index ${targetIndex} from source ${sourceTarget}`);
  await sleep(2000); // Simulate index creation
}

async function updateStatus(
  name: string,
  spec: ReshardingSpec,
  newStatus: string
): Promise<void> {
  const body = {
    spec: {
      ...spec,
      status: newStatus,
    },
  };

  await customApi.patchNamespacedCustomObject(
    GROUP,
    VERSION,
    NAMESPACE,
    PLURAL,
    name,
    body,
    undefined,
    undefined,
    undefined,
    { headers: { "Content-Type": "application/merge-patch+json" } },
  );
  console.log(`Set status to ${newStatus} for ${name}`);
}

async function main(): Promise<void> {
  while (true) {
    try {
      const reshardings = (await customApi.listNamespacedCustomObject(
        GROUP,
        VERSION,
        NAMESPACE,
        PLURAL,
      )) as { body: ReshardingList };

      for (const item of reshardings.body.items) {
        const name = item.metadata.name;
        const spec = item.spec || {};
        const sourceIndex = spec.sourceIndex;
        const targetIndex = spec.targetIndex;

        if (sourceIndex && targetIndex) {
          await reshard(sourceIndex, targetIndex);
        }
        switch (spec.status) {
          case "PENDING":
            console.log(`Status is PENDING for ${name}`);
            await sleep(1000);
            await updateStatus(name, spec, "CREATING_INDEX");
            break;
          case "CREATING_INDEX":
            console.log(`Status is CREATING_INDEX for ${name}`);
            await sleep(1000);
            await updateStatus(name, spec, "ENABLE_DW");
            break;
          case "ENABLE_DW":
            console.log(`Status is ENABLE_DW for ${name}`);
            await sleep(1000);
            await updateStatus(name, spec, "REINDEXING");
            break;
          case "REINDEXING":
            console.log(`Status is REINDEXING for ${name}`);
            await sleep(1000);
            await updateStatus(name, spec, "SWAP_READING");
            break;
          case "SWAP_READING":
            console.log(`Status is SWAP_READING for ${name}`);
            await sleep(1000);
            await updateStatus(name, spec, "CLEANUP");
            break;
          case "CLEANUP":
            console.log(`Status is CLEANUP for ${name}`);
            await sleep(1000);
            // Final state - no further status update needed
            break;
          default:
            console.log(`Unknown status: ${spec.status} for ${name}`);
            await sleep(1000);
            await updateStatus(name, spec, "PENDING");
            break;
        }
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }

    await sleep(10000); // Wait 10 seconds before next iteration
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

// Start the operator
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
