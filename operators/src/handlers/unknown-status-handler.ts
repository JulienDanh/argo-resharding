import * as k8s from "@kubernetes/client-node";
import { ReshardingSpec } from "../types";

const NAMESPACE = "es-config";

export async function createUnknownStatusJob(
  name: string,
  currentStep: string,
  jobsApi: k8s.BatchV1Api,
): Promise<void> {
  const jobName = `unknown-status-${name}`;

  const job = {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: jobName,
      namespace: NAMESPACE,
      labels: {
        "resharding-name": name,
        step: "unknown-status",
      },
    },
    spec: {
      template: {
        spec: {
          containers: [
            {
              name: "unknown-status-worker",
              image: "busybox:latest",
              command: ["/bin/sh"],
              args: [
                "-c",
                `echo "Handling unknown status: ${currentStep} for ${name}" && sleep 5 && echo "Reset to PENDING"`,
              ],
              env: [
                {
                  name: "CURRENT_STEP",
                  value: currentStep,
                },
                {
                  name: "RESHARDING_NAME",
                  value: name,
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
    console.log(`Created job ${jobName} for unknown status ${name}`);
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

export async function handleUnknownStatus(
  name: string,
  spec: ReshardingSpec,
  currentStep: string,
  jobsApi: k8s.BatchV1Api,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Unknown status: ${currentStep} for ${name}`);

  const jobName = `unknown-status-${name}`;

  try {
    // Check if job already exists
    try {
      await jobsApi.readNamespacedJob(jobName, NAMESPACE);
      console.log(`Job ${jobName} already exists for ${name}`);
    } catch (error) {
      // Job doesn't exist, create it
      console.log(`Creating job for unknown status ${name}`);
      await createUnknownStatusJob(name, currentStep, jobsApi);
    }

    // Check job status
    const jobStatus = await checkJobStatus(jobName, jobsApi);

    if (jobStatus === "succeeded") {
      console.log(
        `Job ${jobName} succeeded for ${name}, updating status to PENDING`,
      );
      await updateStatus(name, spec, "PENDING");
    } else if (jobStatus === "failed") {
      console.error(`Job ${jobName} failed for ${name}`);
      // Don't update status, let it retry
    } else {
      console.log(`Job ${jobName} is still running for ${name}`);
      // Don't update status, wait for completion
    }
  } catch (error) {
    console.error(`Error handling unknown status for ${name}:`, error);
  }
}

