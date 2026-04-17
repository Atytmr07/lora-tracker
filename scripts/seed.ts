/**
 * Run once to seed Firestore with sample purchases.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/seed.ts
 * (Requires GOOGLE_APPLICATION_CREDENTIALS or firebase-admin service account)
 *
 * Or paste this into the Firebase console under Firestore and add docs manually.
 */

const SEED_PURCHASES = [
  { date: "2025-05-10", btc: 0.10, price: 103500 },
  { date: "2025-07-15", btc: 0.08, price: 97000 },
  { date: "2025-09-22", btc: 0.15, price: 62000 },
  { date: "2025-11-20", btc: 0.12, price: 91000 },
  { date: "2026-01-08", btc: 0.20, price: 96000 },
  { date: "2026-03-12", btc: 0.05, price: 84000 },
];

console.log("Seed data to add to Firestore collection 'purchases':");
console.log(JSON.stringify(SEED_PURCHASES, null, 2));
console.log("\nYou can also add these via the /admin panel after setting up Firebase Auth.");
