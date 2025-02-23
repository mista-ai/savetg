// content.js

// ==== Global Variables ====
let extensionEnabled = false;
let botDict = {};
// Global variable for button placement (default: top-left)
let buttonPlacement = 'top-left';


// Load necessary values once
chrome.storage.sync.get(['extensionEnabled', 'bot_dict', 'buttonPlacement'], function (data) {
    if (data.extensionEnabled !== undefined) {
        extensionEnabled = data.extensionEnabled;
    }
    if (data.bot_dict) {
        botDict = data.bot_dict;
    }
    if (data.buttonPlacement) {
        buttonPlacement = data.buttonPlacement;
    }
});

// If needed, update storage values "on the fly" when they change
// by adding a listener:
function updateStorageValue(changes, key, targetVar) {
    if (changes[key]) {
        targetVar = changes[key].newValue;
    }
    return targetVar;
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
        extensionEnabled = updateStorageValue(changes, 'extensionEnabled', extensionEnabled);
        botDict = updateStorageValue(changes, 'bot_dict', botDict);
        buttonPlacement = updateStorageValue(changes, 'buttonPlacement', buttonPlacement);
    }
});

let currentTarget = null; // Store the current media element

// ==== The following code directly uses these variables ====
document.addEventListener('mouseover', function (event) {
    // Ignore hovering over the button itself
    if (event.target.classList?.contains('trigger-button')) {
        return;
    }

    // Check if the extension is enabled
    if (extensionEnabled) {
        let target = getTrueMediaElement(event.clientX, event.clientY);

        // If a new element is found and it is valid
        if (target && target !== currentTarget && isTargetValid(target)) {
            currentTarget = target;
            handleTargetHover(target, botDict);

            // When leaving the element, reset currentTarget
            target.addEventListener('mouseleave', resetCurrentTarget, {
                once: true
            });
        }
    }
});

/**
 * Finds the actual media element under the cursor, excluding the button.
 */
function getTrueMediaElement(x, y) {
    let elements = document.elementsFromPoint(x, y);
    //    console.log('🔍 Elements under cursor:', elements);

    // Exclude the button itself
    elements = elements.filter(el => !el.classList?.contains('trigger-button'));

    //    console.log('✅ Selected media element:', target);
    return elements.find(el => isTargetValid(el)) || null;
}

/**
 * Resets the current target when the cursor leaves the media element.
 */
function resetCurrentTarget() {
    //    console.log('❌ Exited media element:', currentTarget);
    currentTarget = null;
}

/**
 * Checks if an element is valid for processing.
 */
function isTargetValid(target) {
    if (!target) return false;
    const isLargeEnough = target.offsetWidth > 150 && target.offsetHeight > 150;
    const isImage = target.tagName === 'IMG';
    const imgUrl = target.src?.split('?')[0];
    const isGif = isImage && (imgUrl && (imgUrl.endsWith('.gif') || imgUrl.endsWith('.webp') || imgUrl.endsWith('.gifv')));
    const isVideoWithSrc = target.tagName === 'VIDEO' && target.hasAttribute('src');
    const isVideoWithSourceTag = target.tagName === 'VIDEO' && target.querySelector('source') !== null;
    return isLargeEnough && (isImage || isGif || isVideoWithSrc || isVideoWithSourceTag);
}

/**
 * When hovering over an element, create a button and position it.
 */
function handleTargetHover(target, bot_dict) {
    let debounceTimer;
    const triggerButton = getOrCreateTriggerButton(target);

    // Show/hide the button when hovering in/out
    target.addEventListener('mouseenter', () => toggleOptionsButton(debounceTimer, triggerButton, true), {
        once: true
    });
    target.addEventListener('mouseleave', () => toggleOptionsButton(debounceTimer, triggerButton, false), {
        once: true
    });

    triggerButton.addEventListener('mouseenter', () => toggleOptionsButton(debounceTimer, triggerButton, true));
    triggerButton.addEventListener('mouseleave', () => toggleOptionsButton(debounceTimer, triggerButton, false));

    // Click on the button => open the menu
    triggerButton.onclick = function () {
        displayPopupMenu(bot_dict, triggerButton, target);
    };
}


// ===== Popup window with textarea and formatting buttons =====

function showTextEditorPanel(mediaUrl, chatId) {
    // Remove if already exists
    let existingPanel = document.getElementById('textEditorPanel');
    if (existingPanel) existingPanel.remove();

    let panel = document.createElement('div');
    panel.id = 'textEditorPanel';
    panel.style.position = 'fixed';
    panel.style.top = '50%';
    panel.style.left = '50%';
    panel.style.transform = 'translate(-50%, -50%)';
    panel.style.backgroundColor = '#fff';
    panel.style.border = '1px solid #ccc';
    panel.style.padding = '15px';
    panel.style.zIndex = '2147483647';

    // Header with close button
    let header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    let title = document.createElement('span');
    title.textContent = 'Enter your message';
    header.appendChild(title);

    let closeBtn = document.createElement('button');
    closeBtn.textContent = '✖';
    closeBtn.style.fontSize = '16px';
    closeBtn.onclick = () => panel.remove();
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Textarea
    let textarea = document.createElement('textarea');
    textarea.style.width = '300px';
    textarea.style.height = '100px';
    textarea.style.marginTop = '10px';
    panel.appendChild(textarea);

    // Formatting buttons block
    let formatButtonsContainer = document.createElement('div');
    formatButtonsContainer.style.marginTop = '10px';

    const formatting = [{symbol: '*', label: 'Bold'}, {symbol: '_', label: 'Italic'}, {
        symbol: '`',
        label: 'Code'
    }, {symbol: '~', label: 'Strikethrough'}];

    formatting.forEach(item => {
        let btn = document.createElement('button');
        btn.textContent = item.label;
        btn.style.marginRight = '5px';
        btn.onclick = () => formatText(textarea, item.symbol);
        formatButtonsContainer.appendChild(btn);
    });
    panel.appendChild(formatButtonsContainer);

    // "Send" button
    let sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send';
    sendBtn.style.marginTop = '10px';
    sendBtn.onclick = function () {
        let msgText = textarea.value;
        sendMediaWithText(mediaUrl, chatId, msgText);
        panel.remove();
    };
    panel.appendChild(sendBtn);

    document.body.appendChild(panel);
}

/**
 * Formats the selected text in the textarea.
 */
function formatText(textarea, symbol) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = symbol + selectedText + symbol;
    textarea.setRangeText(newText);
}

// (Optional) Listener for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'showTextEditor') {
        console.log('Seems to be working: showTextEditor');
        showTextEditorPanel(message.mediaUrl, message.chatId);
        sendResponse({status: 'ok'});
    } else if (message.type === 'sendMediaWithText') {
        console.log('Seems to be working: sendMediaWithText');
        sendMediaWithText(message.mediaUrl, message.chatId);
        sendResponse({status: 'ok'});
    }
});

function getOrCreateTriggerButton(target) {
    let triggerButton = document.getElementById('triggerButton');
    if (!triggerButton) {
        triggerButton = document.createElement('button');
        triggerButton.className = 'trigger-button';
        triggerButton.id = 'triggerButton';
        triggerButton.textContent = 'Save';
        triggerButton.style.pointerEvents = 'auto';
        triggerButton.style.zIndex = '2147483647';
        document.body.appendChild(triggerButton);
    }

    // Position the button near the target
    const rect = target.getBoundingClientRect();
    const btnWidth = triggerButton.offsetWidth;
    const btnHeight = triggerButton.offsetHeight;
    const MARGIN = 10;

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    let left, top;
    switch (buttonPlacement) {
        case 'top-left':
            left = rect.left + MARGIN;
            top = rect.top + MARGIN;
            break;
        case 'top-center':
            left = rect.left + (rect.width - btnWidth) / 2;
            top = rect.top + MARGIN;
            break;
        case 'top-right':
            left = rect.right - btnWidth - MARGIN;
            top = rect.top + MARGIN;
            break;
        case 'center-left':
            left = rect.left + MARGIN;
            top = rect.top + (rect.height - btnHeight) / 2;
            break;
        case 'center':
            left = rect.left + (rect.width - btnWidth) / 2;
            top = rect.top + (rect.height - btnHeight) / 2;
            break;
        case 'center-right':
            left = rect.right - btnWidth - MARGIN;
            top = rect.top + (rect.height - btnHeight) / 2;
            break;
        case 'bottom-left':
            left = rect.left + MARGIN;
            top = rect.bottom - btnHeight - MARGIN;
            break;
        case 'bottom-center':
            left = rect.left + (rect.width - btnWidth) / 2;
            top = rect.bottom - btnHeight - MARGIN;
            break;
        case 'bottom-right':
            left = rect.right - btnWidth - MARGIN;
            top = rect.bottom - btnHeight - MARGIN;
            break;
        default:
            left = rect.left + MARGIN;
            top = rect.top + MARGIN;
            break;
    }

    left = clamp(left, rect.left, rect.right - btnWidth);
    top = clamp(top, rect.top, rect.bottom - btnHeight);

    triggerButton.style.left = (left + window.scrollX) + 'px';
    triggerButton.style.top = (top + window.scrollY) + 'px';
    triggerButton.style.display = 'block';

    return triggerButton;
}


/**
 * Shows the button with a delay (on hover).
 */
function toggleOptionsButton(debounceTimer, triggerButton, isVisible) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        triggerButton.style.display = isVisible ? 'block' : 'none';
    }, 100);
}

/**
 * Opens the popup menu for chat selection.
 */
function displayPopupMenu(bot_dict, triggerButton, target) {
    let menu = createPopupMenu();
    populateMenuWithBotActions(bot_dict, menu, target);
    positionMenuUnderButton(menu, triggerButton);
}

/**
 * Creates a popup menu with an "Exit" button.
 */
function createPopupMenu() {
    let existingMenu = document.getElementById('botDictMenu');
    if (existingMenu) existingMenu.remove();

    let menu = document.createElement('div');
    menu.className = 'bot-dict-menu';

    let exitButton = document.createElement('button');
    exitButton.textContent = 'Exit';
    exitButton.className = 'bot-dict-menu-button';
    exitButton.onclick = function () {
        menu.remove();
    };
    menu.appendChild(exitButton);

    return menu;
}

/**
 * Fills the menu with buttons from bot_dict.
 */
function populateMenuWithBotActions(bot_dict, menu, target) {
    Object.entries(bot_dict).forEach(([chatTitle, chatId]) => {
        let button = document.createElement('button');
        button.className = 'bot-dict-menu-button';
        button.textContent = chatTitle;
        button.onclick = function () {
            let mediaUrl = getImageUrlFromTarget(target);
            sendMediaWithText(mediaUrl, chatId);
            menu.remove();
        };
        menu.appendChild(button);
    });
    document.body.appendChild(menu);
}

/**
 * Positions the menu under the button.
 */
function positionMenuUnderButton(menu, triggerButton) {
    const buttonRect = triggerButton.getBoundingClientRect();
    menu.style.left = `${buttonRect.left + window.scrollX}px`;
    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
}

// Function to "clean" the link (removes query parameters, trailing commas, etc.)
function parseRawLink(url) {
    // First, remove everything after "?", then remove possible ",XYZ"
    return url.split("?")[0].split(",")[0];
}

/**
 * Retrieves the URL of an image or video.
 */
function getImageUrlFromTarget(target) {
    if (target.tagName === 'IMG') {
        if (target.hasAttribute('srcset')) {
            let srcset = target.getAttribute('srcset').split(',').map(src => {
                let parts = src.trim().split(' ');
                return {
                    url: parts[0], width: parseInt(parts[1], 10)
                };
            });
            srcset.sort((a, b) => b.width - a.width);
            return srcset[0].url;
        } else {
            return target.src;
        }
    } else if (target.tagName === 'VIDEO') {
        if (target.hasAttribute('src')) {
            return target.src;
        } else {
            let sources = target.getElementsByTagName('source');
            return sources.length > 0 ? sources[0].src : '';
        }
    }
    return '';
}

/**
 * Displays a toast notification.
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove the notification after 3 seconds (animation will complete automatically)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Sends media with an optional text message.
 */
// 🚀 Request teleport history from background.js
async function getTeleportHistory() {
    return new Promise((resolve) => {
        // Sending a message to background.js to get the teleport history
        chrome.runtime.sendMessage({action: "getTeleportHistory"}, resolve);
    });
}

// 🚀 Save teleport history to background.js
async function setTeleportHistory(data) {
    return new Promise((resolve) => {
        // Sending a message to background.js to set the updated teleport history
        chrome.runtime.sendMessage({action: "setTeleportHistory", data}, resolve);
    });
}

// 🚀 Request teleport history from background.js
async function getTeleportHistory() {
    return new Promise((resolve) => {
        // Sending a message to background.js to get the teleport history
        chrome.runtime.sendMessage({ action: "getTeleportHistory" }, resolve);
    });
}

// 🚀 Save teleport history to background.js
async function setTeleportHistory(data) {
    return new Promise((resolve) => {
        // Sending a message to background.js to set the updated teleport history
        chrome.runtime.sendMessage({ action: "setTeleportHistory", data }, resolve);
    });
}

// 🚀 Main function to send media
window.sendMediaWithText = async function sendMediaWithText(mediaUrl, chatId, msgText) {
    const raw_link = parseRawLink(mediaUrl);  // Get the raw_link for use as the key
    let teleport_history = await getTeleportHistory();  // Fetch the teleport history from IndexedDB

    chrome.storage.sync.get(["save_history"], async (data) => {
        const shouldSave = data.save_history || false;  // Check if history saving is enabled

        // If saving is enabled and the media has not been sent to this chat before
        if (!shouldSave || !(raw_link in teleport_history && chatId in teleport_history[raw_link])) {
            console.log(`📤 Sending media: ${mediaUrl} to chat: ${chatId} with text: "${msgText}"`);

            // Send a POST request to the server to fetch and send media to Telegram
//            fetch("http://localhost:5000/fetch_and_send_to_telegram", {
            fetch("https://teleporter-93407217899.europe-west1.run.app/fetch_and_send_to_telegram", {
//            fetch("${apiUrl}/fetch_and_send_to_telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ media_url: mediaUrl, chat_id: chatId, msg_text: msgText }),
            })
                .then((response) => response.json())  // Parse the response as JSON
                .then(async (result) => {
                    console.log("✅ Success:", result);
                    const linkToTelegramPost = result.link;  // Get the Telegram post link from the response

                    // Check if raw_link already exists in teleport_history
                    teleport_history[raw_link] = teleport_history[raw_link] || {};  // Initialize the object if it doesn't exist
                    teleport_history[raw_link][chatId] = linkToTelegramPost;  // Add chatId as the key and linkToTelegramPost as the value

                    // Save the updated teleport history to IndexedDB
                    await setTeleportHistory(teleport_history);
                    console.log("🌐 teleport_history updated in IndexedDB:", teleport_history);
                })
                .catch((error) => console.error("❌ Error:", error));  // Handle any errors
        } else {
            // If the media has already been sent to this chat, do not resend it
            console.log(raw_link, "has already been sent to this chat", chatId);
            showToast(`⚠ Media will not be sent because it has already been sent before to chat "${chatId}".`);
        }
    });
};
