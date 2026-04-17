export interface Purchase {
  id: string;
  date: string;
  btc: number;
  price: number;
  createdAt?: number;
}

export interface PriceData {
  prices: [number, number][];
}
