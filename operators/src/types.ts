export interface ReshardingSpec {
  sourceIndex?: string;
  targetIndex?: string;
  step?:
    | "PENDING"
    | "CREATING_INDEX"
    | "ENABLE_DW"
    | "REINDEXING"
    | "SWAP_READING"
    | "CLEANUP";
}
