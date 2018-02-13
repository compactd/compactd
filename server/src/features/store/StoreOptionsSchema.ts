export interface StoreOptionSchemaEntry {
  keyName: string;
  defaultValue?: string;
  description?: string;
  validator?: (val: string) => void;
}

type StoreOptionsSchema = StoreOptionSchemaEntry[]

export default StoreOptionsSchema;