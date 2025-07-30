export interface ReshardingSpec {
  sourceIndex?: string;
  targetIndex?: string;
  step?:
    | "PENDING"
    | "CREATING_INDEX"
    | "ENABLE_DW"
    | "REINDEXING"
    | "READ_SWAPPED"
    | "CLEANUP";
}
