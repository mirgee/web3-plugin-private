export type FilterOptions = {
  fromBlock?: number;
  toBlock?: number;
  addresses?: string[];
};

export type CallOptions = {
  to?: string;
  data?: string;
};
