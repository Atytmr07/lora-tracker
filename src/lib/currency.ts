export async function getTryRate(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const cached = localStorage.getItem("tryRate");
  const cachedDate = localStorage.getItem("tryRateDate");
  if (cached && cachedDate === today) return parseFloat(cached);
  const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
  const data = await res.json();
  const rate = data.rates.TRY as number;
  localStorage.setItem("tryRate", String(rate));
  localStorage.setItem("tryRateDate", today);
  return rate;
}
