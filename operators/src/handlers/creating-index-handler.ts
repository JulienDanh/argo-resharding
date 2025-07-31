import { ReshardingSpec } from "../types";

export async function handleCreatingIndex(
  name: string,
  spec: ReshardingSpec,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Status is CREATING_INDEX for ${name}`);
  await new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 9000) + 1000),
  );
  await updateStatus(name, spec, "ENABLE_DW");
}

