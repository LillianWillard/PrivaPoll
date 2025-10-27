import { openDB, DBSchema, IDBPDatabase } from "idb";

interface FhevmDB extends DBSchema {
  publicKeys: {
    key: string;
    value: {
      aclAddress: string;
      publicKey: string;
      publicParams: string;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<FhevmDB> | null = null;

async function getDB(): Promise<IDBPDatabase<FhevmDB>> {
  if (db) return db;

  db = await openDB<FhevmDB>("fhevm-public-keys", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("publicKeys")) {
        db.createObjectStore("publicKeys", { keyPath: "aclAddress" });
      }
    },
  });

  return db;
}

export async function publicKeyStorageGet(aclAddress: string): Promise<{
  publicKey: string;
  publicParams: string;
}> {
  const db = await getDB();
  const stored = await db.get("publicKeys", aclAddress);

  if (stored) {
    return {
      publicKey: stored.publicKey,
      publicParams: stored.publicParams,
    };
  }

  // Return empty strings if not found
  return {
    publicKey: "",
    publicParams: "",
  };
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  const db = await getDB();
  await db.put("publicKeys", {
    aclAddress,
    publicKey,
    publicParams,
    timestamp: Date.now(),
  });
}

