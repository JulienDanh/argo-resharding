import { ReshardingSpec } from "../types";

export async function handleReindexing(
  name: string,
  spec: ReshardingSpec,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Status is REINDEXING for ${name}`);
  await new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 9000) + 1000),
  );
  await updateStatus(name, spec, "READ_SWAPPED");
}

