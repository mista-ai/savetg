import {openDB} from "./libs/idb.js";

const dbName = "MediaSenderDB";
const storeName = "teleport_history";

// Initialize IndexedDB
async function initDB() {
    return await openDB(dbName, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        }
    });
}

// Get teleport history
async function getTeleportHistory() {
    const db = await initDB();
    // Return the entire object (no longer using "history" as the key)
    return (await db.get(storeName, "teleport_history")) || {};
}

// Set teleport history
async function setTeleportHistory(newHistory) {
    const db = await initDB();
    let existingHistory = (await db.get(storeName, "teleport_history")) || {};

    // Merge the new history with the existing one, with each raw_link as the key
    Object.entries(newHistory).forEach(([raw_link, value]) => {
        if (!existingHistory[raw_link]) {
            existingHistory[raw_link] = value;
        } else {
            Object.assign(existingHistory[raw_link], value);
        }
    });

    // Save the updated history to IndexedDB with the new structure
    await db.put(storeName, existingHistory, "teleport_history");
}


// Clear teleport history
async function clearTeleportHistory() {
    const db = await initDB();
    await db.delete(storeName, "history");
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getTeleportHistory") {
        getTeleportHistory().then(sendResponse);
        return true; // Keep the message channel open for async response
    }
    if (message.action === "setTeleportHistory") {
        setTeleportHistory(message.data).then(() => sendResponse({success: true}));
        return true;
    }
    if (message.action === "clearTeleportHistory") {
        clearTeleportHistory().then(() => sendResponse({success: true}));
        return true;
    }
});


/**
 * Initializes variables in chrome.storage.sync when the extension is installed or updated.
 */
function initializeStorageVariables() {
    chrome.storage.sync.get(["bot_dict", "buttonPlacement", "save_history"], // 🚀 Removed 'teleport_history'
        (data) => {
            const updates = {};

            if (!data.bot_dict || typeof data.bot_dict !== "object" || Array.isArray(data.bot_dict)) {
                updates.bot_dict = {};
            }
            if (!data.buttonPlacement || typeof data.buttonPlacement !== "string") {
                updates.buttonPlacement = "top-left";
            }
            if (typeof data.save_history !== "boolean") {
                updates.save_history = false;
            }

            if (Object.keys(updates).length > 0) {
                chrome.storage.sync.set(updates, () => {
                    console.log("Initialized storage variables:", updates);
                });
            }
        });

    // 🚀 Now initialize teleport_history in IndexedDB instead
    initDB().then(() => {
        getTeleportHistory().then(history => {
            if (!history || Object.keys(history).length === 0) {
                console.log("📂 Initializing empty teleport_history in IndexedDB");
                setTeleportHistory({});
            }
        });
    });
}

/**
 * Function to recreate the context menu.
 */
function refreshContextMenus() {
    chrome.contextMenus.removeAll(() => {
        chrome.storage.sync.get(["bot_dict"], (data) => {
            const bot_dict = data.bot_dict || {};
            const chatNames = Object.keys(bot_dict);

            chrome.contextMenus.create({
                id: "mediaSender", title: "Media Sender", contexts: ["image", "video"]
            });

            chrome.contextMenus.create({
                id: "sendSubmenu", title: "Send", parentId: "mediaSender", contexts: ["image", "video"]
            });

            chrome.contextMenus.create({
                id: "sendWithTextSubmenu",
                title: "Send with text",
                parentId: "mediaSender",
                contexts: ["image", "video"]
            });

            if (chatNames.length === 0) {
                chrome.contextMenus.create({
                    id: "noChatsSend",
                    title: "No chats found",
                    parentId: "sendSubmenu",
                    enabled: false,
                    contexts: ["image", "video"]
                });
                chrome.contextMenus.create({
                    id: "noChatsSendWithText",
                    title: "No chats found",
                    parentId: "sendWithTextSubmenu",
                    enabled: false,
                    contexts: ["image", "video"]
                });
                return;
            }

            chatNames.forEach((chatName) => {
                chrome.contextMenus.create({
                    id: `sendDirect-${chatName}`, title: chatName, parentId: "sendSubmenu", contexts: ["image", "video"]
                });
                chrome.contextMenus.create({
                    id: `sendWithText-${chatName}`,
                    title: chatName,
                    parentId: "sendWithTextSubmenu",
                    contexts: ["image", "video"]
                });
            });
        });
    });
}

/**
 * Handles clicks on the context menu.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const menuId = info.menuItemId;

    // Mapping menu item prefixes to corresponding message types
    const menuActions = {
        "sendDirect-": "sendMediaWithText", "sendWithText-": "showTextEditor"
        // Add new types here without duplicating logic
    };

    // Determine the action based on `menuId`
    const action = Object.entries(menuActions).find(([prefix]) => menuId.startsWith(prefix));
    if (!action) return; // If no matching action, do nothing

    const [prefix, messageType] = action;
    const chatName = menuId.replace(prefix, "");

    chrome.storage.sync.get(["bot_dict"], (data) => {
        const bot_dict = data.bot_dict || {};
        const chatId = bot_dict[chatName];

        if (!chatId) {
            alert(`Chat "${chatName}" not found in bot_dict.`);
            return;
        }

        chrome.tabs.sendMessage(tab.id, {
            type: messageType, mediaUrl: info.srcUrl, chatId: chatId
        });
    });
});

/**
 * Event handlers for installation and startup.
 */
chrome.runtime.onInstalled.addListener(() => {
    initializeStorageVariables();
    refreshContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
    refreshContextMenus();
});

/**
 * Update the context menu if bot_dict changes.
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes.bot_dict) {
        refreshContextMenus();
    }
});
