import * as k8s from "@kubernetes/client-node";

const NAMESPACE = "es-config";

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

export async function createJob(
  jobName: string,
  name: string,
  step: string,
  command: string,
  jobsApi: k8s.BatchV1Api,
  env?: Array<{ name: string; value: string }>,
): Promise<void> {
  const job = {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: jobName,
      namespace: NAMESPACE,
      labels: {
        "resharding-name": name,
        step: step,
      },
    },
    spec: {
      template: {
        spec: {
          containers: [
            {
              name: `${step}-worker`,
              image: "busybox:latest",
              command: ["/bin/sh"],
              args: ["-c", command],
              env: env || [],
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
    console.log(`Created job ${jobName} for ${step} ${name}`);
  } catch (error) {
    console.error(`Failed to create job ${jobName}:`, error);
    throw error;
  }
}

export async function handleJobStep(
  name: string,
  spec: any,
  jobName: string,
  step: string,
  command: string,
  nextStep: string | null,
  jobsApi: k8s.BatchV1Api,
  updateStatus: (name: string, spec: any, newStatus: string) => Promise<void>,
  env?: Array<{ name: string; value: string }>,
): Promise<void> {
  try {
    // Check if job already exists
    try {
      await jobsApi.readNamespacedJob(jobName, NAMESPACE);
      console.log(`Job ${jobName} already exists for ${name}`);
    } catch (error) {
      // Job doesn't exist, create it
      console.log(`Creating job for ${step} ${name}`);
      await createJob(jobName, name, step, command, jobsApi, env);
    }

    // Check job status
    const jobStatus = await checkJobStatus(jobName, jobsApi);

    if (jobStatus === "succeeded") {
      if (nextStep) {
        console.log(
          `Job ${jobName} succeeded for ${name}, updating status to ${nextStep}`,
        );
        await updateStatus(name, spec, nextStep);
      } else {
        console.log(`Job ${jobName} succeeded for ${name}, step completed`);
      }
    } else if (jobStatus === "failed") {
      console.error(`Job ${jobName} failed for ${name}`);
      // Don't update status, let it retry
    } else {
      console.log(`Job ${jobName} is still running for ${name}`);
      // Don't update status, wait for completion
    }
  } catch (error) {
    console.error(`Error handling ${step} status for ${name}:`, error);
  }
} 