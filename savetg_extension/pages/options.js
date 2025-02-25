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


    // JSON Management Elements
    const toggleJsonBlock = document.getElementById('toggleJsonBlock');
    const jsonBlock = document.getElementById('jsonBlock');
    const jsonMode = document.getElementById('jsonMode');
    const jsonTextarea = document.getElementById('jsonTextarea');
    const processJson = document.getElementById('processJson');


    loadChats();

    // Load and save button position setting
    chrome.storage.sync.get(['buttonPlacement'], function (data) {
        if (data.buttonPlacement) {
            buttonPositionSelect.value = data.buttonPlacement;
        }
    });


    // --- NEW ELEMENTS FOR HISTORY ---
    const openHistoryBtn = document.getElementById('openHistory');
    const historyPage = document.getElementById('historyPage');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const saveHistoryBtn = document.getElementById('saveHistoryBtn');

    // 🔹 Adding the Refresh button
    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

    // Add the Refresh button to the History section
    historyPage.insertBefore(refreshHistoryBtn, historyList);


    // 🔍 Search history
    const searchHistoryInput = document.getElementById('searchHistoryInput');
    const searchHistoryBtn = document.getElementById('searchHistoryBtn');
    const searchHistoryResult = document.getElementById('searchHistoryResult');


    // Toggle "Saved Chats" visibility
    const toggleSavedChatsBtn = document.getElementById('toggleSavedChats');
    const chatListContainer = document.getElementById('chatListContainer');

    // Toggle "Channels (bot_dict)" visibility
    const toggleBotDictBtn = document.getElementById('toggleBotDict');

    const botDictContainer = document.getElementById('botDictContainer');

    // Load Channels (bot_dict) with the ability to hide
    chrome.storage.sync.get(['bot_dict'], function (data) {
        const bot_dict = data.bot_dict || {};
        botDictContainer.innerHTML = ''; // Clear before updating

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
                chrome.storage.sync.set({'bot_dict': bot_dict}, function () {
                    loadData();
                    loadChats();
                });
            };
            item.appendChild(span);
            item.appendChild(delBtn);
            botDictContainer.appendChild(item);
        }
    });

    let currentPage = 1;
    let itemsPerPage = 5; // Number of items per page
    let teleportHistory = {}; // Global variable for storing history

    const paginationContainer = document.createElement('div'); // Container for pagination
    const toggleHistoryBtn = document.createElement('button'); // Button to hide history
    toggleHistoryBtn.textContent = "Show History";
    toggleHistoryBtn.classList.add('toggle-history-btn');

    // Add the toggle button before the history
    historyPage.insertBefore(toggleHistoryBtn, historyList);
    historyPage.insertBefore(refreshHistoryBtn, historyList);

    // Add the pagination container to the page
    paginationContainer.classList.add('pagination-container');
    historyPage.appendChild(paginationContainer);

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

    saveButtonPositionBtn.addEventListener('click', function () {
        const position = buttonPositionSelect.value;
        chrome.storage.sync.set({
            'buttonPlacement': position
        }, function () {
            alert('Button position saved!');
        });
    });

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

    // 🔹 Click event handler for the Refresh button
    refreshHistoryBtn.addEventListener('click', function () {
        loadHistory(); // Reload history
    });

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
        loadSaveHistoryState();
    });

    // Attach a handler to the search button
    searchHistoryBtn.addEventListener('click', searchTeleportHistory);

    toggleSavedChatsBtn.addEventListener('click', function () {
        chatListContainer.classList.toggle('hidden-block');
    });

    toggleBotDictBtn.addEventListener('click', function () {
        botDictContainer.classList.toggle('hidden-block');
    });

    // 🔹 Function to hide/show history
    toggleHistoryBtn.addEventListener('click', function () {
        refreshHistoryBtn.classList.toggle('hidden');
        historyList.classList.toggle('hidden');
        paginationContainer.classList.toggle('hidden');
        toggleHistoryBtn.textContent = historyList.classList.contains('hidden') ? "Show History" : "Hide History";
    });

    // 🚀 Clear button action
    clearHistoryBtn.addEventListener('click', async function () {
        if (confirm("Are you sure you want to clear the entire Teleport History?")) {
            await clearTeleportHistory();
            await loadHistory();
        }
    });

    chrome.storage.local.get(["searchQuery"], (result) => {
        try {
            if (result.searchQuery) {
                // Скрываем все страницы, кроме History
                settingsPage.classList.add('hidden');
                faqPage.classList.add('hidden');
                buttonPositionPage.classList.add('hidden');
                dataPage.classList.add('hidden');
                historyPage.classList.remove('hidden'); // Показываем историю

                searchTeleportHistory(result.searchQuery)
                    .then(() => chrome.storage.local.remove("searchQuery")) // Удаляем searchQuery после завершения
                    .catch(console.error); // Обрабатываем возможные ошибки
            } else {
                // Если searchQuery нет, показываем "Chats" по умолчанию
                settingsPage.classList.remove('hidden');
                faqPage.classList.add('hidden');
                buttonPositionPage.classList.add('hidden');
                dataPage.classList.add('hidden');
                historyPage.classList.add('hidden');
            }
        } catch (error) {
            console.error("Error while searching history:", error);
        } finally {
            // Удаляем searchQuery в любом случае
            chrome.storage.local.remove("searchQuery");
        }
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

    // Load data for the Data page
    function loadData() {
        dataList.innerHTML = '';

        // Load lastChatId
        chrome.storage.sync.get(['lastChatId'], function (data) {
            const lastChatId = data.lastChatId;
            const lastDiv = document.createElement('div');
            lastDiv.innerHTML = '<h4>Last Chat</h4>';

            if (lastChatId) {
                // Retrieve the chat name from bot_dict using lastChatId
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

    // 🚀 Clear teleport history via background.js
    async function clearTeleportHistory() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({action: "clearTeleportHistory"}, resolve);
        });
    }

    async function generateHistoryTable(entries, container, refreshCallback) {
        container.innerHTML = '';

        if (entries.length === 0) {
            container.innerHTML = '<p>No history.</p>';
            return;
        }

        const table = document.createElement('table');
        table.classList.add('history-table');

        // Table header
        const headerRow = document.createElement('tr');
        ['Image Link', 'Chat Name', 'Msg Number', 'Actions'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Filling the table with data
        for (const [rawLink, chatObj] of entries) {
            for (const [chat_id, tgLink] of Object.entries(chatObj)) {
                const row = document.createElement('tr');

                // The first row with the image spans multiple rows
                if (Object.keys(chatObj).indexOf(chat_id) === 0) {
                    const tdImage = document.createElement('td');
                    tdImage.rowSpan = Object.entries(chatObj).length;
                    const imageAnchor = document.createElement('a');
                    imageAnchor.href = rawLink;
                    imageAnchor.textContent = rawLink;
                    imageAnchor.target = "_blank";
                    tdImage.appendChild(imageAnchor);
                    row.appendChild(tdImage);
                }

                // Retrieve the chat name from storage
                const bot_dict = await new Promise(resolve => {
                    chrome.storage.sync.get(['bot_dict'], function (data) {
                        resolve(data.bot_dict || {});
                    });
                });

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

                // 🔹 Delete button
                const tdAction = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = "&#10006;"; // ❌
                deleteButton.classList.add('delete-button');

                deleteButton.onclick = async function () {
                    if (confirm("Are you sure you want to delete this message from history?")) {
                        await deleteTeleportHistoryEntry(rawLink, chat_id);
                        refreshCallback(); // Refresh the list after deletion
                    }
                };

                tdAction.appendChild(deleteButton);
                row.appendChild(tdAction);

                table.appendChild(row);
            }
        }

        container.appendChild(table);
    }

    // Function for searching in teleport_history
    async function searchTeleportHistory(mediaUrl = null) {
        let cleanUrl;

        if (typeof mediaUrl !== "string" || !mediaUrl.trim()) {
            // Check if the element exists
            if (!searchHistoryInput || !searchHistoryInput.value.trim()) {
                alert("Enter a media link to search.");
                return;
            }
            // Process the link from input
            cleanUrl = searchHistoryInput.value.trim().split("?")[0].split(",")[0];
        } else {
            // Use mediaUrl if it is provided
            cleanUrl = mediaUrl.split("?")[0].split(",")[0];
        }

        console.log("Searching for:", cleanUrl); // 🔍 Check what value is being searched

        // Clear results before a new search
        searchHistoryResult.innerHTML = '';

        // Retrieve teleport_history
        let teleport_history = await getTeleportHistory();

        console.log("Teleport history:", teleport_history); // 🔍 Check the received history

        // Filter by matching link
        let foundEntries = Object.entries(teleport_history).filter(([rawLink]) => {
            return rawLink.split("?")[0].split(",")[0] === cleanUrl;
        });

        console.log("Found entries:", foundEntries); // 🔍 Check what is found

        if (foundEntries.length === 0) {
            searchHistoryResult.innerHTML = "<p>No matches found.</p>";
            return;
        }

        // Generate a table
        await generateHistoryTable(foundEntries, searchHistoryResult, searchTeleportHistory);
    }


    // 🚀 Function for loading history with pagination
    async function loadHistory(page = 1) {
        historyList.innerHTML = '';
        currentPage = page;

        teleportHistory = await getTeleportHistory();

        if (Object.keys(teleportHistory).length === 0) {
            historyList.innerHTML = '<p>No history.</p>';
            return;
        }

        const entries = Object.entries(teleportHistory);
        const totalItems = entries.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Page limits
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Filter data by the current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedEntries = entries.slice(startIndex, startIndex + itemsPerPage);

        // Generate a table
        await generateHistoryTable(paginatedEntries, historyList, () => loadHistory(currentPage));

        updatePagination(totalPages);
    }

    // 🔹 Function to update pagination
    function updatePagination(totalPages) {
        paginationContainer.innerHTML = '';

        const prevButton = document.createElement('button');
        prevButton.textContent = "← Prev";
        prevButton.classList.add('pagination-btn');
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => loadHistory(currentPage - 1));

        const nextButton = document.createElement('button');
        nextButton.textContent = "Next →";
        nextButton.classList.add('pagination-btn');
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => loadHistory(currentPage + 1));

        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(document.createTextNode(` Page ${currentPage} of ${totalPages} `));
        paginationContainer.appendChild(nextButton);
    }

    // 🚀 Request history
    async function getTeleportHistory() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({action: "getTeleportHistory"}, resolve);
        });
    }

    // 🚀 Delete history entry
    async function deleteTeleportHistoryEntry(rawLink, chatId) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({action: "deleteTeleportHistoryEntry", rawLink, chatId}, resolve);
        });
    }

    // Start loading history when the page is opened
    document.getElementById('openHistory').addEventListener('click', function () {
        historyPage.classList.remove('hidden');
        loadHistory();
    });

    // Функция экспорта истории в JSON-файл
    function exportTeleportHistory() {
        chrome.runtime.sendMessage({action: "getTeleportHistory"}, function (history) {
            const jsonStr = JSON.stringify(history, null, 2);
            const blob = new Blob([jsonStr], {type: "application/json"});
            const url = URL.createObjectURL(blob);

            // Создаём временную ссылку для скачивания
            const a = document.createElement("a");
            a.href = url;
            a.download = "teleport_history.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

// Функция импорта истории из JSON-файла
    function importTeleportHistory(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const jsonData = JSON.parse(event.target.result);
                chrome.runtime.sendMessage({action: "setTeleportHistory", data: jsonData}, function (response) {
                    if (response && response.success) {
                        alert("Teleport history imported successfully!");
                    } else {
                        alert("Import failed. Please check your JSON format.");
                    }
                });
            } catch (e) {
                alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
    }

// Привязываем события к кнопкам
    document.getElementById("exportHistoryBtn").addEventListener("click", exportTeleportHistory);

    document.getElementById("importHistoryBtn").addEventListener("click", function () {
        document.getElementById("importHistoryInput").click();
    });

    document.getElementById("importHistoryInput").addEventListener("change", function (e) {
        const file = e.target.files[0];
        importTeleportHistory(file);
    });

});