import { ReshardingSpec } from "../types";
import { handleJobStep } from "../utils/job-utils";

export async function handleEnableDw(
  name: string,
  spec: ReshardingSpec,
  jobsApi: any,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Status is ENABLE_DW for ${name}`);

  const sourceIndex = spec.sourceIndex;
  const targetIndex = spec.targetIndex;

  if (!sourceIndex || !targetIndex) {
    console.error(`Missing sourceIndex or targetIndex for ${name}`);
    return;
  }

  const jobName = `enable-dw-${name}`;
  const command = `echo "Enabling data write for ${targetIndex}" && sleep 12 && echo "Data write enabled"`;
  const env = [
    { name: "SOURCE_INDEX", value: sourceIndex },
    { name: "TARGET_INDEX", value: targetIndex },
  ];

  await handleJobStep(
    name,
    spec,
    jobName,
    "enable-dw",
    command,
    "REINDEXING",
    jobsApi,
    updateStatus,
    env,
  );
}
