import { Purchase } from "./types";

const KEY = "btc_purchases";

export function getPurchasesLocal(): Purchase[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Purchase[];
  } catch {
    return [];
  }
}

export function addPurchaseLocal(data: Omit<Purchase, "id" | "createdAt">): void {
  const list = getPurchasesLocal();
  list.push({ ...data, id: Date.now().toString() });
  list.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function deletePurchaseLocal(id: string): void {
  const list = getPurchasesLocal().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
