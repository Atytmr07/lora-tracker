export async function getLivePrice(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    { cache: "no-store" }
  );
  const data = await res.json();
  return data.bitcoin.usd as number;
}

export async function getHistoricalPrices(): Promise<[number, number][]> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily"
  );
  const data = await res.json();
  return data.prices as [number, number][];
}
