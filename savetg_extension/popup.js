document.addEventListener('DOMContentLoaded', function () {
    // Get elements
    const instructionDiv = document.getElementById('instruction');
    const buttonsDiv = document.getElementById('buttons');

    const openBotBtn = document.getElementById('openBot');
    const openBot2Btn = document.getElementById('openBot2');
    const openFAQBtn = document.getElementById('openFAQ');
    const openChatsBtn = document.getElementById('openChats');
    const addChatBtn = document.getElementById('addChat');

    const turnOnBtn = document.getElementById('turnOn');
    const turnOffBtn = document.getElementById('turnOff');

    const chatIdInput = document.getElementById('chat_id');
    const chatTitleInput = document.getElementById('chat_title');

    //----------------------------------------------------------------
    // Load last entered Chat ID on popup open
    chrome.storage.sync.get(['input_chat_id', 'extensionEnabled'], function (data) {
        if (data.input_chat_id) {
            chatIdInput.value = data.input_chat_id;
        }
        updateToggleButtons(data.extensionEnabled);
    });

    // Save Chat ID immediately when typing
    chatIdInput.addEventListener('input', function () {
        chrome.storage.sync.set({'input_chat_id': chatIdInput.value});
    });

    //----------------------------------------------------------------
    // Check if there are saved chats
    function checkChats() {
        chrome.storage.sync.get(['bot_dict'], function (data) {
            const bot_dict = data.bot_dict || {};
            const hasChats = Object.keys(bot_dict).length > 0;

            if (hasChats) {
                instructionDiv.classList.add('hidden');
                buttonsDiv.classList.remove('hidden');
            } else {
                instructionDiv.classList.remove('hidden');
                buttonsDiv.classList.add('hidden');
            }
        });
    }

    //----------------------------------------------------------------
    // Add new chat
    addChatBtn.addEventListener('click', function () {
        const chat_id = chatIdInput.value.trim();
        const chat_title = chatTitleInput.value.trim();

        if (!chat_id || !chat_title) {
            alert('Enter both Chat ID and Chat Title!');
            return;
        }

        chrome.storage.sync.get(['bot_dict'], function (data) {
            const bot_dict = data.bot_dict || {};
            bot_dict[chat_title] = chat_id;

            chrome.storage.sync.set({'bot_dict': bot_dict}, function () {
                chatIdInput.value = '';
                chatTitleInput.value = '';
                chrome.storage.sync.remove('last_chat_id'); // Clear saved Chat ID after adding
                checkChats();
            });
        });
    });

    //----------------------------------------------------------------
    // Turn On / Turn Off functionality
    turnOnBtn.addEventListener('click', function () {
        chrome.storage.sync.set({'extensionEnabled': true}, function () {
            updateToggleButtons(true);
        });
    });

    turnOffBtn.addEventListener('click', function () {
        chrome.storage.sync.set({'extensionEnabled': false}, function () {
            updateToggleButtons(false);
        });
    });

    function updateToggleButtons(isEnabled) {
        if (isEnabled) {
            turnOnBtn.style.backgroundColor = '#28a745'; // Green
            turnOffBtn.style.backgroundColor = '#ccc';   // Gray
        } else {
            turnOnBtn.style.backgroundColor = '#ccc';   // Gray
            turnOffBtn.style.backgroundColor = '#dc3545'; // Red
        }
    }

    //----------------------------------------------------------------
    // Open Options Page - Chats (Default Page)
    openChatsBtn.addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });

    //----------------------------------------------------------------
    // Open Options Page - FAQ
    openFAQBtn.addEventListener('click', function () {
        chrome.storage.sync.set({'openFAQ': true}, function () {
            chrome.runtime.openOptionsPage();
        });
    });

    //----------------------------------------------------------------
    // Buttons
    openBotBtn.addEventListener('click', function () {
        window.open('https://t.me/mista_save_tg_bot', '_blank');
    });

    openBot2Btn.addEventListener('click', function () {
        window.open('https://t.me/mista_save_tg_bot', '_blank');
    });

    //----------------------------------------------------------------
    // Initialize on load
    checkChats();
});
