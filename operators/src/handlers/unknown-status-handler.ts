import { ReshardingSpec } from "../types";

export async function handleUnknownStatus(
  name: string,
  spec: ReshardingSpec,
  currentStep: string,
  updateStatus: (
    name: string,
    spec: ReshardingSpec,
    newStatus: string,
  ) => Promise<void>,
): Promise<void> {
  console.log(`Unknown status: ${currentStep} for ${name}`);
  await new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 9000) + 1000),
  );
  await updateStatus(name, spec, "PENDING");
}

