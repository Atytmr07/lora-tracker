import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Purchase } from "./types";

const COL = "purchases";

export async function getPurchases(): Promise<Purchase[]> {
  const q = query(collection(db, COL), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Purchase, "id">) }));
}

export async function addPurchase(data: Omit<Purchase, "id" | "createdAt">) {
  await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
}

export async function deletePurchase(id: string) {
  await deleteDoc(doc(db, COL, id));
}
