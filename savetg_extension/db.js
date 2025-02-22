// Open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("teleportDB", 1);

        request.onupgradeneeded = (event) => {
            let db = event.target.result;
            if (!db.objectStoreNames.contains("teleport_history")) {
                db.createObjectStore("teleport_history", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Save a new entry in history
async function saveTeleportHistory(data) {
    const db = await openDB();
    const transaction = db.transaction("teleport_history", "readwrite");
    const store = transaction.objectStore("teleport_history");
    store.add({ timestamp: Date.now(), data });
}

// Retrieve all history records
async function getTeleportHistory() {
    const db = await openDB();
    return new Promise((resolve) => {
        const transaction = db.transaction("teleport_history", "readonly");
        const store = transaction.objectStore("teleport_history");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
    });
}

// Clear history
async function clearTeleportHistory() {
    const db = await openDB();
    const transaction = db.transaction("teleport_history", "readwrite");
    const store = transaction.objectStore("teleport_history");
    store.clear();
}