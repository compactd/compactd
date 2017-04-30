export interface SDAOptions {
  host: string;
  port: number;
}

export interface Message {
  type: string;
  data?: SDAOptions;
}
