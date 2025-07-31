import { ReshardingSpec } from "../types";

export async function handleCleanup(
  name: string,
  spec: ReshardingSpec,
): Promise<void> {
  console.log(`Status is CLEANUP for ${name}`);
  await new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 9000) + 1000),
  );
  // Final state - no further status update needed
}

