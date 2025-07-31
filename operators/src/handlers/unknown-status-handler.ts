import { ReshardingSpec } from "../types";
import { handleJobStep } from "../utils/job-utils";

export async function handleUnknownStatus(
  name: string,
  spec: ReshardingSpec,
  currentStep: string,
  jobsApi: any,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Unknown status: ${currentStep} for ${name}`);

  const jobName = `unknown-status-${name}`;
  const command = `echo "Handling unknown status: ${currentStep} for ${name}" && sleep 5 && echo "Reset to PENDING"`;
  const env = [
    { name: "CURRENT_STEP", value: currentStep },
    { name: "RESHARDING_NAME", value: name },
  ];

  await handleJobStep(
    name,
    spec,
    jobName,
    "unknown-status",
    command,
    "PENDING",
    jobsApi,
    updateStatus,
    env,
  );
}
