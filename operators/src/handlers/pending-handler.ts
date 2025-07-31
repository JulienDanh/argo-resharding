import { ReshardingSpec } from "../types";
import { handleJobStep } from "../utils/job-utils";

export async function handlePending(
  name: string,
  spec: ReshardingSpec,
  jobsApi: any,
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
  const command = `echo "Creating index ${targetIndex} from ${sourceIndex}" && sleep 10 && echo "Index creation completed"`;
  const env = [
    { name: "SOURCE_INDEX", value: sourceIndex },
    { name: "TARGET_INDEX", value: targetIndex },
  ];

  await handleJobStep(
    name,
    spec,
    jobName,
    "resharding",
    command,
    "CREATING_INDEX",
    jobsApi,
    updateStatus,
    env,
  );
}
