import * as k8s from "@kubernetes/client-node";
import { ReshardingSpec } from "../types";

const NAMESPACE = "es-config";

export async function createReshardingJob(
  name: string,
  sourceIndex: string,
  targetIndex: string,
  jobsApi: k8s.BatchV1Api,
): Promise<void> {
  const jobName = `resharding-${name}`;

  const job = {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: jobName,
      namespace: NAMESPACE,
      labels: {
        "resharding-name": name,
        step: "creating-index",
      },
    },
    spec: {
      template: {
        spec: {
          containers: [
            {
              name: "resharding-worker",
              image: "busybox:latest",
              command: ["/bin/sh"],
              args: [
                "-c",
                `echo "Creating index ${targetIndex} from ${sourceIndex}" && sleep 10 && echo "Index creation completed"`,
              ],
              env: [
                {
                  name: "SOURCE_INDEX",
                  value: sourceIndex,
                },
                {
                  name: "TARGET_INDEX",
                  value: targetIndex,
                },
              ],
            },
          ],
          restartPolicy: "Never",
        },
      },
      backoffLimit: 3,
    },
  };

  try {
    await jobsApi.createNamespacedJob(NAMESPACE, job);
    console.log(`Created job ${jobName} for resharding ${name}`);
  } catch (error) {
    console.error(`Failed to create job ${jobName}:`, error);
    throw error;
  }
}

export async function checkJobStatus(
  jobName: string,
  jobsApi: k8s.BatchV1Api,
): Promise<"succeeded" | "failed" | "running"> {
  try {
    const job = await jobsApi.readNamespacedJob(jobName, NAMESPACE);
    const status = job.body.status;

    if (status?.succeeded && status.succeeded > 0) {
      return "succeeded";
    } else if (status?.failed && status.failed > 0) {
      return "failed";
    } else {
      return "running";
    }
  } catch (error) {
    console.error(`Failed to check job status for ${jobName}:`, error);
    throw error;
  }
}

export async function handlePending(
  name: string,
  spec: ReshardingSpec,
  jobsApi: k8s.BatchV1Api,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Status is PENDING for ${name}`);

  const sourceIndex = spec.sourceIndex;
  const targetIndex = spec.targetIndex;

  if (!sourceIndex || !targetIndex) {
    console.error(`Missing sourceIndex or targetIndex for ${name}`);
    return;
  }

  const jobName = `resharding-${name}`;

  try {
    // Check if job already exists
    try {
      await jobsApi.readNamespacedJob(jobName, NAMESPACE);
      console.log(`Job ${jobName} already exists for ${name}`);
    } catch (error) {
      // Job doesn't exist, create it
      console.log(`Creating job for resharding ${name}`);
      await createReshardingJob(name, sourceIndex, targetIndex, jobsApi);
    }

    // Check job status
    const jobStatus = await checkJobStatus(jobName, jobsApi);

    if (jobStatus === "succeeded") {
      console.log(
        `Job ${jobName} succeeded for ${name}, updating status to CREATING_INDEX`,
      );
      await updateStatus(name, spec, "CREATING_INDEX");
    } else if (jobStatus === "failed") {
      console.error(`Job ${jobName} failed for ${name}`);
      // Don't update status, let it retry
    } else {
      console.log(`Job ${jobName} is still running for ${name}`);
      // Don't update status, wait for completion
    }
  } catch (error) {
    console.error(`Error handling PENDING status for ${name}:`, error);
  }
}

