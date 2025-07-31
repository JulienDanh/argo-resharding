import { ReshardingSpec } from "../types";
import { handleJobStep } from "../utils/job-utils";

export async function handleCreatingIndex(
  name: string,
  spec: ReshardingSpec,
  jobsApi: any,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Status is CREATING_INDEX for ${name}`);

  const sourceIndex = spec.sourceIndex;
  const targetIndex = spec.targetIndex;

  if (!sourceIndex || !targetIndex) {
    console.error(`Missing sourceIndex or targetIndex for ${name}`);
    return;
  }

  const jobName = `creating-index-${name}`;
  const command = `echo "Creating index ${targetIndex} from ${sourceIndex}" && sleep 15 && echo "Index creation completed"`;
  const env = [
    { name: "SOURCE_INDEX", value: sourceIndex },
    { name: "TARGET_INDEX", value: targetIndex },
  ];

  await handleJobStep(
    name,
    spec,
    jobName,
    "creating-index",
    command,
    "ENABLE_DW",
    jobsApi,
    updateStatus,
    env,
  );
}
