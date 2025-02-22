// src/content/content.js

class TelegramMediaExtension {
    constructor() {
        this.extensionEnabled = false;
        this.botDict = {};
        this.buttonPlacement = 'top-left';
        this.currentTarget = null;
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupStorageListener();
        this.setupEventListeners();
    }

    loadSettings() {
        chrome.storage.sync.get(['extensionEnabled', 'bot_dict', 'buttonPlacement'], (data) => {
            this.extensionEnabled = data.extensionEnabled ?? false;
            this.botDict = data.bot_dict ?? {};
            this.buttonPlacement = data.buttonPlacement ?? 'top-left';
        });
    }

    setupStorageListener() {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'sync') {
                if (changes.extensionEnabled) this.extensionEnabled = changes.extensionEnabled.newValue;
                if (changes.bot_dict) this.botDict = changes.bot_dict.newValue;
                if (changes.buttonPlacement) this.buttonPlacement = changes.buttonPlacement.newValue;
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('mouseover', (event) => this.handleMouseOver(event));
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => this.handleMessages(message, sendResponse));
    }

    handleMouseOver(event) {
        if (!this.extensionEnabled || event.target.classList?.contains('trigger-button')) return;

        let target = this.getTrueMediaElement(event.clientX, event.clientY);
        if (target && target !== this.currentTarget && this.isTargetValid(target)) {
            this.currentTarget = target;
            this.handleTargetHover(target);

            target.addEventListener('mouseleave', () => this.resetCurrentTarget(), { once: true });
        }
    }

    getTrueMediaElement(x, y) {
        let elements = document.elementsFromPoint(x, y).filter(el => !el.classList?.contains('trigger-button'));
        return elements.find(el => this.isTargetValid(el)) || null;
    }

    resetCurrentTarget() {
        this.currentTarget = null;
    }

    isTargetValid(target) {
        if (!target) return false;
        const isLargeEnough = target.offsetWidth > 150 && target.offsetHeight > 150;
        const isImage = target.tagName === 'IMG';
        const imgUrl = target.src?.split('?')[0];
        const isGif = isImage && imgUrl && (imgUrl.endsWith('.gif') || imgUrl.endsWith('.webp') || imgUrl.endsWith('.gifv'));
        const isVideo = target.tagName === 'VIDEO' && (target.hasAttribute('src') || target.querySelector('source') !== null);
        return isLargeEnough && (isImage || isGif || isVideo);
    }

    handleTargetHover(target) {
        let debounceTimer;
        const triggerButton = this.getOrCreateTriggerButton(target);

        target.addEventListener('mouseenter', () => this.toggleButtonVisibility(debounceTimer, triggerButton, true), { once: true });
        target.addEventListener('mouseleave', () => this.toggleButtonVisibility(debounceTimer, triggerButton, false), { once: true });

        triggerButton.addEventListener('mouseenter', () => this.toggleButtonVisibility(debounceTimer, triggerButton, true));
        triggerButton.addEventListener('mouseleave', () => this.toggleButtonVisibility(debounceTimer, triggerButton, false));

        triggerButton.onclick = () => this.displayPopupMenu(triggerButton, target);
    }

    getOrCreateTriggerButton(target) {
        let triggerButton = document.getElementById('triggerButton');
        if (!triggerButton) {
            triggerButton = document.createElement('button');
            triggerButton.className = 'trigger-button';
            triggerButton.id = 'triggerButton';
            triggerButton.textContent = 'Save';
            document.body.appendChild(triggerButton);
        }
        this.positionButton(triggerButton, target);
        return triggerButton;
    }

    positionButton(button, target) {
        const rect = target.getBoundingClientRect();
        const MARGIN = 10;
        let left = rect.left + MARGIN;
        let top = rect.top + MARGIN;

        switch (this.buttonPlacement) {
            case 'top-right': left = rect.right - button.offsetWidth - MARGIN; break;
            case 'bottom-left': top = rect.bottom - button.offsetHeight - MARGIN; break;
            case 'bottom-right':
                left = rect.right - button.offsetWidth - MARGIN;
                top = rect.bottom - button.offsetHeight - MARGIN;
                break;
        }

        button.style.left = `${left + window.scrollX}px`;
        button.style.top = `${top + window.scrollY}px`;
        button.style.display = 'block';
    }

    toggleButtonVisibility(debounceTimer, button, isVisible) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            button.style.display = isVisible ? 'block' : 'none';
        }, 100);
    }

    displayPopupMenu(triggerButton, target) {
        let menu = document.createElement('div');
        menu.className = 'bot-dict-menu';

        Object.entries(this.botDict).forEach(([chatTitle, chatId]) => {
            let button = document.createElement('button');
            button.className = 'bot-dict-menu-button';
            button.textContent = chatTitle;
            button.onclick = () => {
                let mediaUrl = this.getImageUrlFromTarget(target);
                this.sendMediaWithText(mediaUrl, chatId);
                menu.remove();
            };
            menu.appendChild(button);
        });

        document.body.appendChild(menu);
        menu.style.left = `${triggerButton.getBoundingClientRect().left + window.scrollX}px`;
        menu.style.top = `${triggerButton.getBoundingClientRect().bottom + window.scrollY}px`;
    }

    getImageUrlFromTarget(target) {
        if (target.tagName === 'IMG') {
            return target.hasAttribute('srcset') ? target.getAttribute('srcset').split(',')[0].split(' ')[0] : target.src;
        }
        if (target.tagName === 'VIDEO') {
            return target.hasAttribute('src') ? target.src : target.querySelector('source')?.src || '';
        }
        return '';
    }

    sendMediaWithText(mediaUrl, chatId) {
        const cleanUrl = mediaUrl.split('?')[0];

        chrome.storage.sync.get(['save_history', 'teleport_history'], (data) => {
            const shouldSave = data.save_history || false;
            let teleportHistory = data.teleport_history || {};

            if (!shouldSave || !(cleanUrl in teleportHistory && chatId in teleportHistory[cleanUrl])) {
                fetch('http://localhost:5000/fetch_and_send_to_telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ media_url: mediaUrl, chat_id: chatId }),
                })
                .then(response => response.json())
                .then(result => {
                    teleportHistory[cleanUrl] = teleportHistory[cleanUrl] || {};
                    teleportHistory[cleanUrl][chatId] = result.link;
                    chrome.storage.sync.set({ teleport_history: teleportHistory });
                })
                .catch(error => console.error('Error:', error));
            } else {
                this.showToast(`⚠ Media already sent to chat "${chatId}".`);
            }
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    handleMessages(message, sendResponse) {
        if (message.type === 'sendMediaWithText') {
            this.sendMediaWithText(message.mediaUrl, message.chatId, message.text || '');
            sendResponse({ status: 'ok' });
        }
    }
}

// Initialize the extension
new TelegramMediaExtension();
