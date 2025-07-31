import { ReshardingSpec } from "../types";
import { handleJobStep } from "../utils/job-utils";

export async function handleReindexing(
  name: string,
  spec: ReshardingSpec,
  jobsApi: any,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Status is REINDEXING for ${name}`);

  const sourceIndex = spec.sourceIndex;
  const targetIndex = spec.targetIndex;

  if (!sourceIndex || !targetIndex) {
    console.error(`Missing sourceIndex or targetIndex for ${name}`);
    return;
  }

  const jobName = `reindexing-${name}`;
  const command = `echo "Reindexing from ${sourceIndex} to ${targetIndex}" && sleep 20 && echo "Reindexing completed"`;
  const env = [
    { name: "SOURCE_INDEX", value: sourceIndex },
    { name: "TARGET_INDEX", value: targetIndex },
  ];

  await handleJobStep(
    name,
    spec,
    jobName,
    "reindexing",
    command,
    "READ_SWAPPED",
    jobsApi,
    updateStatus,
    env,
  );
}
