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

function randomSleep(
  minMs: number = 1000,
  maxMs: number = 10000,
): Promise<void> {
  const sleepMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return sleep(sleepMs);
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
  newStatus: string,
): Promise<void> {
  const body = {
    spec: {
      ...spec,
      step: newStatus,
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

async function handlePending(
  name: string,
  spec: ReshardingSpec,
): Promise<void> {
  console.log(`Status is PENDING for ${name}`);
  await randomSleep();
  await updateStatus(name, spec, "CREATING_INDEX");
}

async function handleCreatingIndex(
  name: string,
  spec: ReshardingSpec,
): Promise<void> {
  console.log(`Status is CREATING_INDEX for ${name}`);
  await randomSleep();
  await updateStatus(name, spec, "ENABLE_DW");
}

async function handleEnableDw(
  name: string,
  spec: ReshardingSpec,
): Promise<void> {
  console.log(`Status is ENABLE_DW for ${name}`);
  await randomSleep();
  await updateStatus(name, spec, "REINDEXING");
}

async function handleReindexing(
  name: string,
  spec: ReshardingSpec,
): Promise<void> {
  console.log(`Status is REINDEXING for ${name}`);
  await randomSleep();
  await updateStatus(name, spec, "READ_SWAPPED");
}

async function handleReadSwapped(
  name: string,
  spec: ReshardingSpec,
): Promise<void> {
  console.log(`Status is READ_SWAPPED for ${name}`);
  await randomSleep();
  await updateStatus(name, spec, "CLEANUP");
}

async function handleCleanup(
  name: string,
  spec: ReshardingSpec,
): Promise<void> {
  console.log(`Status is CLEANUP for ${name}`);
  await randomSleep();
  // Final state - no further status update needed
}

async function handleUnknownStatus(
  name: string,
  spec: ReshardingSpec,
  currentStep: string,
): Promise<void> {
  console.log(`Unknown status: ${currentStep} for ${name}`);
  await randomSleep();
  await updateStatus(name, spec, "PENDING");
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

      await Promise.all(
        reshardings.body.items.map(async (item) => {
          const name = item.metadata.name;
          const spec = item.spec || {};

          switch (spec.step) {
            case "PENDING":
              await handlePending(name, spec);
              break;
            case "CREATING_INDEX":
              await handleCreatingIndex(name, spec);
              break;
            case "ENABLE_DW":
              await handleEnableDw(name, spec);
              break;
            case "REINDEXING":
              await handleReindexing(name, spec);
              break;
            case "READ_SWAPPED":
              await handleReadSwapped(name, spec);
              break;
            case "CLEANUP":
              await handleCleanup(name, spec);
              break;
            default:
              await handleUnknownStatus(name, spec, spec.step || "undefined");
              break;
          }
        }),
      );
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
