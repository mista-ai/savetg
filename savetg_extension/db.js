import {openDB} from "./libs/idb.js";

const dbName = "MediaSenderDB";  // ✅ Ensure only this DB is used
const storeName = "teleport_history";

async function initDB() {
    return await openDB(dbName, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        }
    });
}

export async function getTeleportHistory() {
    const db = await initDB();
    let result = await db.get(storeName, "history");

    console.log("🔍 Retrieved teleport_history from IndexedDB:", result); // Debugging output

    return result || {};
}

export async function setTeleportHistory(newHistory) {
    const db = await initDB();

    // Retrieve existing history
    let existingHistory = await db.get(storeName, "history") || {};

    console.log("📥 Existing teleport_history before update:", existingHistory);

    // Merge the old and new history
    Object.entries(newHistory).forEach(([key, value]) => {
        if (!existingHistory[key]) {
            existingHistory[key] = value;
        } else {
            Object.assign(existingHistory[key], value);
        }
    });

    console.log("📤 Updated teleport_history being saved:", existingHistory);

    await db.put(storeName, existingHistory, "history");
}

export async function clearTeleportHistory() {
    const db = await initDB();
    await db.delete(storeName, "history");
}
