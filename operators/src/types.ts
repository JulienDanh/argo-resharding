export interface ReshardingSpec {
  sourceIndex?: string;
  targetIndex?: string;
  status?:
    | "PENDING"
    | "CREATING_INDEX"
    | "ENABLE_DW"
    | "REINDEXING"
    | "SWAP_READING"
    | "CLEANUP";
}
