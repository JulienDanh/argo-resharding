import { ReshardingSpec } from "../types";
import { handleJobStep } from "../utils/job-utils";

export async function handleReadSwapped(
  name: string,
  spec: ReshardingSpec,
  jobsApi: any,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Status is READ_SWAPPED for ${name}`);

  const sourceIndex = spec.sourceIndex;
  const targetIndex = spec.targetIndex;

  if (!sourceIndex || !targetIndex) {
    console.error(`Missing sourceIndex or targetIndex for ${name}`);
    return;
  }

  const jobName = `read-swapped-${name}`;
  const command = `echo "Swapping read operations from ${sourceIndex} to ${targetIndex}" && sleep 8 && echo "Read operations swapped"`;
  const env = [
    { name: "SOURCE_INDEX", value: sourceIndex },
    { name: "TARGET_INDEX", value: targetIndex },
  ];

  await handleJobStep(
    name,
    spec,
    jobName,
    "read-swapped",
    command,
    "CLEANUP",
    jobsApi,
    updateStatus,
    env,
  );
}
