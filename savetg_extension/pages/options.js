document.addEventListener('DOMContentLoaded', function () {
    // Navigation elements and pages
    const settingsPage = document.getElementById('settingsPage');
    const faqPage = document.getElementById('faqPage');
    const buttonPositionPage = document.getElementById('buttonPositionPage');
    const dataPage = document.getElementById('dataPage');
    const openSettingsBtn = document.getElementById('openSettings');
    const openFAQBtn = document.getElementById('openFAQ');
    const openButtonPositionBtn = document.getElementById('openButtonPosition');
    const openDataBtn = document.getElementById('openData');

    // Chat settings elements
    const chatIdInput = document.getElementById('chat_id');
    const chatNameInput = document.getElementById('chat_name');
    const saveChatBtn = document.getElementById('saveChat');
    const chatList = document.getElementById('chatList');

    // Button position setting elements
    const buttonPositionSelect = document.getElementById('buttonPositionSelect');
    const saveButtonPositionBtn = document.getElementById('saveButtonPosition');

    // Data page elements
    const dataList = document.getElementById('dataList');
    const clearDataBtn = document.getElementById('clearData');

    // Tab switching
    openSettingsBtn.addEventListener('click', function () {
        settingsPage.classList.remove('hidden');
        faqPage.classList.add('hidden');
        buttonPositionPage.classList.add('hidden');
        dataPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
    });
    openFAQBtn.addEventListener('click', function () {
        faqPage.classList.remove('hidden');
        settingsPage.classList.add('hidden');
        buttonPositionPage.classList.add('hidden');
        dataPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
    });
    openButtonPositionBtn.addEventListener('click', function () {
        buttonPositionPage.classList.remove('hidden');
        settingsPage.classList.add('hidden');
        faqPage.classList.add('hidden');
        dataPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
    });
    openDataBtn.addEventListener('click', function () {
        dataPage.classList.remove('hidden');
        settingsPage.classList.add('hidden');
        faqPage.classList.add('hidden');
        buttonPositionPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
        loadData();
    });


    // Function to load saved chats
    function loadChats() {
        chrome.storage.sync.get(['bot_dict'], function (data) {
            const bot_dict = data.bot_dict || {};
            chatList.innerHTML = '';
            Object.entries(bot_dict).forEach(([chat_name, chat_id]) => {
                const chatItem = document.createElement('div');
                chatItem.className = 'data-item';
                chatItem.innerHTML = `<span>${chat_name}: ${chat_id}</span>`;
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'X';
                deleteBtn.className = 'delete-btn';
                deleteBtn.onclick = function () {
                    delete bot_dict[chat_name];
                    chrome.storage.sync.set({
                        'bot_dict': bot_dict
                    }, loadChats);
                };
                chatItem.appendChild(deleteBtn);
                chatList.appendChild(chatItem);
            });
        });
    }

    // Saving a new chat
    saveChatBtn.addEventListener('click', function () {
        const chat_id = chatIdInput.value.trim();
        const chat_name = chatNameInput.value.trim();
        if (!chat_id || !chat_name) {
            alert('Enter both Chat ID and Chat Name!');
            return;
        }
        chrome.storage.sync.get(['bot_dict'], function (data) {
            const bot_dict = data.bot_dict || {};
            bot_dict[chat_name] = chat_id;
            chrome.storage.sync.set({
                'bot_dict': bot_dict
            }, function () {
                chatIdInput.value = '';
                chatNameInput.value = '';
                loadChats();
            });
        });
    });

    // JSON Management Elements
    const toggleJsonBlock = document.getElementById('toggleJsonBlock');
    const jsonBlock = document.getElementById('jsonBlock');
    const jsonMode = document.getElementById('jsonMode');
    const jsonTextarea = document.getElementById('jsonTextarea');
    const processJson = document.getElementById('processJson');

    // Toggle JSON block visibility
    toggleJsonBlock.addEventListener('click', function () {
        jsonBlock.classList.toggle('hidden');
    });

    // Handle JSON Import & Export
    processJson.addEventListener('click', function () {
        const mode = jsonMode.value;

        if (mode === 'import') {
            try {
                const jsonData = JSON.parse(jsonTextarea.value);
                if (!Array.isArray(jsonData)) throw new Error("Invalid JSON format");

                chrome.storage.sync.get(['bot_dict'], function (data) {
                    const bot_dict = data.bot_dict || {};
                    jsonData.forEach(({chat_name, chat_id}) => {
                        if (chat_name && chat_id) {
                            bot_dict[chat_name] = chat_id;
                        }
                    });

                    chrome.storage.sync.set({'bot_dict': bot_dict}, function () {
                        alert("Chats Imported Successfully!");
                        jsonTextarea.value = ''; // Clear input after import
                        loadChats();
                    });
                });
            } catch (error) {
                alert("Invalid JSON format. Ensure it's a list of objects with 'chat_name' and 'chat_id'.");
            }
        } else if (mode === 'export') {
            chrome.storage.sync.get(['bot_dict'], function (data) {
                const bot_dict = data.bot_dict || {};
                const jsonArray = Object.entries(bot_dict).map(([chat_name, chat_id]) => ({
                    chat_name, chat_id
                }));
                jsonTextarea.value = JSON.stringify(jsonArray, null, 2);
            });
        }
    });


    loadChats();

    // Load and save button position setting
    chrome.storage.sync.get(['buttonPlacement'], function (data) {
        if (data.buttonPlacement) {
            buttonPositionSelect.value = data.buttonPlacement;
        }
    });
    saveButtonPositionBtn.addEventListener('click', function () {
        const position = buttonPositionSelect.value;
        chrome.storage.sync.set({
            'buttonPlacement': position
        }, function () {
            alert('Button position saved!');
        });
    });

    // Load data for the Data page
    function loadData() {
        dataList.innerHTML = '';

        // Load channels (bot_dict)
        chrome.storage.sync.get(['bot_dict'], function (data) {
            const bot_dict = data.bot_dict || {};
            const channelsDiv = document.createElement('div');
            dataList.appendChild(channelsDiv);
        });

        // Load lastChatId
        chrome.storage.sync.get(['lastChatId'], function (data) {
            const lastChatId = data.lastChatId;
            const lastDiv = document.createElement('div');
            lastDiv.innerHTML = '<h4>Last Chat</h4>';

            if (lastChatId) {
                // Получаем имя чата из bot_dict по lastChatId
                chrome.storage.sync.get(['bot_dict'], function (botData) {
                    const bot_dict = botData.bot_dict || {};
                    const chatName = Object.keys(bot_dict).find(name => bot_dict[name] === lastChatId);

                    if (chatName) {
                        lastDiv.innerHTML += `<p>${chatName}: ${lastChatId} <button id="deleteLast" class="delete-btn">Delete</button></p>`;
                    } else {
                        lastDiv.innerHTML += `<p>Chat ID: ${lastChatId} (name not found) <button id="deleteLast" class="delete-btn">Delete</button></p>`;
                    }

                    dataList.appendChild(lastDiv);
                    document.getElementById('deleteLast').addEventListener('click', function () {
                        chrome.storage.sync.remove('lastChatId', loadData);
                    });
                });
            } else {
                lastDiv.innerHTML += '<p>(none)</p>';
                dataList.appendChild(lastDiv);
            }
        });


        // Load button position
        chrome.storage.sync.get(['buttonPlacement'], function (data) {
            const posDiv = document.createElement('div');
            posDiv.innerHTML = '<h4>Button Position</h4>';
            posDiv.innerHTML += `<p>${data.buttonPlacement || 'top-left'}</p>`;
            dataList.appendChild(posDiv);
        });
    }

    // Button to clear all data
    clearDataBtn.addEventListener('click', function () {
        if (confirm("Are you sure you want to clear all stored data?")) {
            chrome.storage.sync.clear(function () {
                alert("All data cleared!");
                loadData();
                loadChats();
            });
        }
    });

    // --- NEW ELEMENTS FOR HISTORY ---
    const openHistoryBtn = document.getElementById('openHistory');
    const historyPage = document.getElementById('historyPage');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const saveHistoryBtn = document.getElementById('saveHistoryBtn');

    // 🔹 Adding the Refresh button
    const refreshHistoryBtn = document.createElement('button');
    refreshHistoryBtn.textContent = 'Refresh';
    refreshHistoryBtn.id = 'refreshHistoryBtn'

    // Add the Refresh button to the History section
    historyPage.insertBefore(refreshHistoryBtn, historyList);

    // 🔹 Click event handler for the Refresh button
    refreshHistoryBtn.addEventListener('click', function () {
        loadHistory(); // Reload history
    });

    // Function to load the save history state
    function loadSaveHistoryState() {
        chrome.storage.sync.get(['save_history'], function (data) {
            const saveState = data.save_history || false;
            updateSaveHistoryButton(saveState);
        });
    }

    // Function to update the appearance of the Save History button
    function updateSaveHistoryButton(isSaved) {
        if (isSaved) {
            // "Don't Save History" state – button turns red
            saveHistoryBtn.textContent = "Don't Save History";
            saveHistoryBtn.style.backgroundColor = "#dc3545";
        } else {
            // "Save History" state – standard appearance
            saveHistoryBtn.textContent = "Save History";
            saveHistoryBtn.style.backgroundColor = "#28a745";
        }
    }



    // Click event handler for the Save History button
    saveHistoryBtn.addEventListener('click', function () {
        chrome.storage.sync.get(['save_history'], function (data) {
            const currentState = data.save_history || false;
            chrome.storage.sync.set({
                save_history: !currentState
            }, function () {
                updateSaveHistoryButton(!currentState);
                console.log("save_history set to:", !currentState);
            });
        });
    });

    // Click event handler for the "History" button in the menu
    openHistoryBtn.addEventListener('click', function () {
        // Hide all other pages
        settingsPage.classList.add('hidden');
        faqPage.classList.add('hidden');
        buttonPositionPage.classList.add('hidden');
        dataPage.classList.add('hidden');

        // Show the History page
        historyPage.classList.remove('hidden');

        // Load History data and button state
        loadHistory();
        loadSaveHistoryState();
    });

    // 🚀 Request teleport history from background.js
    async function getTeleportHistory() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({action: "getTeleportHistory"}, resolve);
        });
    }

    // 🚀 Clear teleport history via background.js
    async function clearTeleportHistory() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "clearTeleportHistory" }, resolve);
        });
    }


    async function loadHistory() {
        historyList.innerHTML = '';

        let teleport_history = await getTeleportHistory();

        if (Object.keys(teleport_history).length === 0) {
            historyList.innerHTML = '<p>No history.</p>';
            return;
        }

        const table = document.createElement('table');
        table.classList.add('history-table');

        // Заголовок таблицы
        const headerRow = document.createElement('tr');
        ['Image Link', 'Chat Name', 'Msg Number', 'Actions'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Заполнение таблицы данными из истории
        Object.entries(teleport_history).forEach(([rawLink, chatObj]) => {
            Object.entries(chatObj).forEach(([chat_id, tgLink], index) => {
                const row = document.createElement('tr');

                if (index === 0) {
                    const tdImage = document.createElement('td');
                    tdImage.rowSpan = Object.entries(chatObj).length;
                    const imageAnchor = document.createElement('a');
                    imageAnchor.href = rawLink;
                    imageAnchor.textContent = rawLink;
                    imageAnchor.target = "_blank";
                    tdImage.appendChild(imageAnchor);
                    row.appendChild(tdImage);
                }

                // Получение имени чата из bot_dict
                chrome.storage.sync.get(['bot_dict'], function (data) {
                    const bot_dict = data.bot_dict || {};
                    const chat_name = Object.keys(bot_dict).find(name => bot_dict[name] === chat_id);

                    const tdChat = document.createElement('td');
                    tdChat.textContent = chat_name || `Unknown chat (${chat_id})`;
                    row.appendChild(tdChat);

                    const tdMsg = document.createElement('td');
                    const messageLink = document.createElement('a');
                    messageLink.href = tgLink;
                    messageLink.textContent = "message_link";
                    messageLink.target = "_blank";
                    tdMsg.appendChild(messageLink);
                    row.appendChild(tdMsg);

                    // 🔹 Кнопка удаления
                    const tdAction = document.createElement('td');

                    const deleteButton = document.createElement('button');
                    deleteButton.innerHTML = "&#10006;"; // ❌
                    deleteButton.classList.add('delete-button');

                    deleteButton.onclick = async function () {
                        if (confirm("Are you sure you want to delete this message from history?")) {
                            await deleteTeleportHistoryEntry(rawLink, chat_id);
                            loadHistory();
                        }
                    };
                    tdAction.appendChild(deleteButton);
                    row.appendChild(tdAction);

                    table.appendChild(row);
                });
            });
        });

        historyList.appendChild(table);
    }


    // 🚀 Функция удаления записи через background.js
    async function deleteTeleportHistoryEntry(rawLink, chatId) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "deleteTeleportHistoryEntry", rawLink, chatId }, resolve);
        });
    }



    // 🚀 Clear button action
    clearHistoryBtn.addEventListener('click', async function () {
        if (confirm("Are you sure you want to clear the entire Teleport History?")) {
            await clearTeleportHistory();
            loadHistory();
        }
    });

    // 🔍 Поиск по истории
    const searchHistoryInput = document.getElementById('searchHistoryInput');
    const searchHistoryBtn = document.getElementById('searchHistoryBtn');
    const searchHistoryResult = document.getElementById('searchHistoryResult');

    // Функция поиска по teleport_history
    async function searchTeleportHistory() {
        const inputValue = searchHistoryInput.value.trim();
        if (!inputValue) {
            alert("Enter a media link to search.");
            return;
        }

        // Очистка результатов перед новым поиском
        searchHistoryResult.innerHTML = '';

        // Преобразуем ссылку: оставляем только основной URL без параметров
        const cleanUrl = inputValue.split("?")[0].split(",")[0];

        // Получаем teleport_history
        let teleport_history = await getTeleportHistory();

        // Фильтруем по совпадению ссылки
        let foundEntries = {};
        Object.entries(teleport_history).forEach(([rawLink, chatObj]) => {
            const linkWithoutParams = rawLink.split("?")[0].split(",")[0];
            if (linkWithoutParams === cleanUrl) {
                foundEntries[rawLink] = chatObj;
            }
        });

        // Если ничего не найдено
        if (Object.keys(foundEntries).length === 0) {
            searchHistoryResult.innerHTML = "<p>No matches found.</p>";
            return;
        }

        // Создание таблицы с результатами
        const table = document.createElement('table');
        table.classList.add('history-table');

        // Заголовок таблицы
        const headerRow = document.createElement('tr');
        ['Image Link', 'Chat Name', 'Msg Number', 'Actions'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Заполняем таблицу результатами поиска
        Object.entries(foundEntries).forEach(([rawLink, chatObj]) => {
            Object.entries(chatObj).forEach(([chat_id, tgLink], index) => {
                const row = document.createElement('tr');

                if (index === 0) {
                    const tdImage = document.createElement('td');
                    tdImage.rowSpan = Object.entries(chatObj).length;
                    const imageAnchor = document.createElement('a');
                    imageAnchor.href = rawLink;
                    imageAnchor.textContent = rawLink;
                    imageAnchor.target = "_blank";
                    tdImage.appendChild(imageAnchor);
                    row.appendChild(tdImage);
                }

                // Получаем имя чата
                chrome.storage.sync.get(['bot_dict'], function (data) {
                    const bot_dict = data.bot_dict || {};
                    const chat_name = Object.keys(bot_dict).find(name => bot_dict[name] === chat_id);

                    const tdChat = document.createElement('td');
                    tdChat.textContent = chat_name || `Unknown chat (${chat_id})`;
                    row.appendChild(tdChat);

                    const tdMsg = document.createElement('td');
                    const messageLink = document.createElement('a');
                    messageLink.href = tgLink;
                    messageLink.textContent = "message_link";
                    messageLink.target = "_blank";
                    tdMsg.appendChild(messageLink);
                    row.appendChild(tdMsg);

                    // 🔹 Кнопка удаления
                    const tdAction = document.createElement('td');

                    const deleteButton = document.createElement('button');
                    deleteButton.innerHTML = "&#10006;"; // ❌
                    deleteButton.classList.add('delete-button');

                    deleteButton.onclick = async function () {
                        if (confirm("Are you sure you want to delete this message from history?")) {
                            await deleteTeleportHistoryEntry(rawLink, chat_id);
                            searchTeleportHistory(); // Обновить результаты поиска
                        }
                    };
                    tdAction.appendChild(deleteButton);
                    row.appendChild(tdAction);

                    table.appendChild(row);
                });
            });
        });

        searchHistoryResult.appendChild(table);
    }

    // Навешиваем обработчик на кнопку поиска
    searchHistoryBtn.addEventListener('click', searchTeleportHistory);

    // Toggle "Saved Chats" visibility
    const toggleSavedChatsBtn = document.getElementById('toggleSavedChats');
    const chatListContainer = document.getElementById('chatListContainer');

    toggleSavedChatsBtn.addEventListener('click', function () {
        chatListContainer.classList.toggle('hidden-block');
    });

    // Toggle "Channels (bot_dict)" visibility
    const toggleBotDictBtn = document.getElementById('toggleBotDict');
    const botDictContainer = document.getElementById('botDictContainer');

    toggleBotDictBtn.addEventListener('click', function () {
        botDictContainer.classList.toggle('hidden-block');
    });

    // Загрузка Channels (bot_dict) с возможностью скрытия
    chrome.storage.sync.get(['bot_dict'], function (data) {
        const bot_dict = data.bot_dict || {};
        botDictContainer.innerHTML = ''; // Очищаем перед обновлением

        for (const [chatName, chatId] of Object.entries(bot_dict)) {
            const item = document.createElement('div');
            item.className = 'data-item';
            const span = document.createElement('span');
            span.textContent = `${chatName}: ${chatId}`;
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.className = 'delete-btn';
            delBtn.onclick = function () {
                delete bot_dict[chatName];
                chrome.storage.sync.set({ 'bot_dict': bot_dict }, function () {
                    loadData();
                    loadChats();
                });
            };
            item.appendChild(span);
            item.appendChild(delBtn);
            botDictContainer.appendChild(item);
        }
    });
});