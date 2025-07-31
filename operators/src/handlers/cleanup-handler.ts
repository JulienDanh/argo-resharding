import { ReshardingSpec } from "../types";
import { handleJobStep } from "../utils/job-utils";

export async function handleCleanup(
  name: string,
  spec: ReshardingSpec,
  jobsApi: any,
): Promise<void> {
  console.log(`Status is CLEANUP for ${name}`);

  const sourceIndex = spec.sourceIndex;
  const targetIndex = spec.targetIndex;

  if (!sourceIndex || !targetIndex) {
    console.error(`Missing sourceIndex or targetIndex for ${name}`);
    return;
  }

  const jobName = `cleanup-${name}`;
  const command = `echo "Cleaning up old index ${sourceIndex}" && sleep 10 && echo "Cleanup completed"`;
  const env = [
    { name: "SOURCE_INDEX", value: sourceIndex },
    { name: "TARGET_INDEX", value: targetIndex },
  ];

  await handleJobStep(
    name,
    spec,
    jobName,
    "cleanup",
    command,
    null, // Final state - no next step
    jobsApi,
    () => Promise.resolve(), // Dummy updateStatus function since this is the final step
    env,
  );
}
