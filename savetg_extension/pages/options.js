document.addEventListener('DOMContentLoaded', function() {
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

    // Elements for exporting JSON
    const exportChatsBtn = document.getElementById('exportChats');
    const exportedJsonArea = document.getElementById('exportedJson');

    // Elements for importing JSON
    const jsonInput = document.getElementById('jsonInput');
    const saveFromJsonBtn = document.getElementById('saveFromJson');

    // Button position setting elements
    const buttonPositionSelect = document.getElementById('buttonPositionSelect');
    const saveButtonPositionBtn = document.getElementById('saveButtonPosition');

    // Data page elements
    const dataList = document.getElementById('dataList');
    const clearDataBtn = document.getElementById('clearData');

    // Tab switching
    openSettingsBtn.addEventListener('click', function() {
        settingsPage.classList.remove('hidden');
        faqPage.classList.add('hidden');
        buttonPositionPage.classList.add('hidden');
        dataPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
    });
    openFAQBtn.addEventListener('click', function() {
        faqPage.classList.remove('hidden');
        settingsPage.classList.add('hidden');
        buttonPositionPage.classList.add('hidden');
        dataPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
    });
    openButtonPositionBtn.addEventListener('click', function() {
        buttonPositionPage.classList.remove('hidden');
        settingsPage.classList.add('hidden');
        faqPage.classList.add('hidden');
        dataPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
    });
    openDataBtn.addEventListener('click', function() {
        dataPage.classList.remove('hidden');
        settingsPage.classList.add('hidden');
        faqPage.classList.add('hidden');
        buttonPositionPage.classList.add('hidden');
        historyPage.classList.add('hidden'); // hide History
        loadData();
    });


    // Function to load saved chats
    function loadChats() {
        chrome.storage.sync.get(['bot_dict'], function(data) {
            const bot_dict = data.bot_dict || {};
            chatList.innerHTML = '';
            Object.entries(bot_dict).forEach(([chat_name, chat_id]) => {
                const chatItem = document.createElement('div');
                chatItem.className = 'data-item';
                chatItem.innerHTML = `<span>${chat_name}: ${chat_id}</span>`;
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'X';
                deleteBtn.className = 'delete-btn';
                deleteBtn.onclick = function() {
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
    saveChatBtn.addEventListener('click', function() {
        const chat_id = chatIdInput.value.trim();
        const chat_name = chatNameInput.value.trim();
        if (!chat_id || !chat_name) {
            alert('Enter both Chat ID and Chat Name!');
            return;
        }
        chrome.storage.sync.get(['bot_dict'], function(data) {
            const bot_dict = data.bot_dict || {};
            bot_dict[chat_name] = chat_id;
            chrome.storage.sync.set({
                'bot_dict': bot_dict
            }, function() {
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
                    jsonData.forEach(({ chat_name, chat_id }) => {
                        if (chat_name && chat_id) {
                            bot_dict[chat_name] = chat_id;
                        }
                    });

                    chrome.storage.sync.set({ 'bot_dict': bot_dict }, function () {
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
                    chat_name,
                    chat_id
                }));
                jsonTextarea.value = JSON.stringify(jsonArray, null, 2);
            });
        }
    });


    loadChats();

    // Load and save button position setting
    chrome.storage.sync.get(['buttonPlacement'], function(data) {
        if (data.buttonPlacement) {
            buttonPositionSelect.value = data.buttonPlacement;
        }
    });
    saveButtonPositionBtn.addEventListener('click', function() {
        const position = buttonPositionSelect.value;
        chrome.storage.sync.set({
            'buttonPlacement': position
        }, function() {
            alert('Button position saved!');
        });
    });

    // Load data for the Data page
    function loadData() {
        dataList.innerHTML = '';

        // Load channels (bot_dict)
        chrome.storage.sync.get(['bot_dict'], function(data) {
            const bot_dict = data.bot_dict || {};
            const channelsDiv = document.createElement('div');
            channelsDiv.innerHTML = '<h4>Channels (bot_dict)</h4>';
            for (const [chatName, chatId] of Object.entries(bot_dict)) {
                const item = document.createElement('div');
                item.className = 'data-item';
                const span = document.createElement('span');
                span.textContent = `${chatName}: ${chatId}`;
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.className = 'delete-btn';
                delBtn.onclick = function() {
                    delete bot_dict[chatName];
                    chrome.storage.sync.set({
                        'bot_dict': bot_dict
                    }, function() {
                        loadData();
                        loadChats();
                    });
                };
                item.appendChild(span);
                item.appendChild(delBtn);
                channelsDiv.appendChild(item);
            }
            dataList.appendChild(channelsDiv);
        });

        // Load lastChat
        chrome.storage.sync.get(['lastChat'], function(data) {
            const lastChat = data.lastChat;
            const lastDiv = document.createElement('div');
            lastDiv.innerHTML = '<h4>Last Chat</h4>';
            if (lastChat && lastChat.name && lastChat.id) {
                lastDiv.innerHTML += `<p>${lastChat.name}: ${lastChat.id} <button id="deleteLast" class="delete-btn">Delete</button></p>`;
            } else {
                lastDiv.innerHTML += '<p>(none)</p>';
            }
            dataList.appendChild(lastDiv);
            if (lastChat && lastChat.name && lastChat.id) {
                document.getElementById('deleteLast').addEventListener('click', function() {
                    chrome.storage.sync.remove('lastChat', loadData);
                });
            }
        });

        // Load button position
        chrome.storage.sync.get(['buttonPlacement'], function(data) {
            const posDiv = document.createElement('div');
            posDiv.innerHTML = '<h4>Button Position</h4>';
            posDiv.innerHTML += `<p>${data.buttonPlacement || 'top-left'}</p>`;
            dataList.appendChild(posDiv);
        });
    }

    // Button to clear all data
    clearDataBtn.addEventListener('click', function() {
        if (confirm("Are you sure you want to clear all stored data?")) {
            chrome.storage.sync.clear(function() {
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
    refreshHistoryBtn.style.marginLeft = '10px';
    refreshHistoryBtn.style.backgroundColor = '#007bff';
    refreshHistoryBtn.style.color = 'white';
    refreshHistoryBtn.style.padding = '5px 10px';
    refreshHistoryBtn.style.border = 'none';
    refreshHistoryBtn.style.borderRadius = '4px';
    refreshHistoryBtn.style.cursor = 'pointer';
    refreshHistoryBtn.style.fontSize = '14px';

    // Add the Refresh button to the History section
    historyPage.insertBefore(refreshHistoryBtn, historyList);

    // 🔹 Click event handler for the Refresh button
    refreshHistoryBtn.addEventListener('click', function() {
        loadHistory(); // Reload history
    });

    // Function to load the save history state
    function loadSaveHistoryState() {
        chrome.storage.sync.get(['save_history'], function(data) {
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
    saveHistoryBtn.addEventListener('click', function() {
        chrome.storage.sync.get(['save_history'], function(data) {
            const currentState = data.save_history || false;
            chrome.storage.sync.set({
                save_history: !currentState
            }, function() {
                updateSaveHistoryButton(!currentState);
                console.log("save_history set to:", !currentState);
            });
        });
    });

    // Click event handler for the "History" button in the menu
    openHistoryBtn.addEventListener('click', function() {
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

    // Function to load teleport_history from chrome.storage.sync as a table with three columns
    function loadHistory() {
        historyList.innerHTML = '';
        chrome.storage.sync.get(['teleport_history'], function(data) {
            const teleport_history = data.teleport_history || {};
            if (Object.keys(teleport_history).length === 0) {
                historyList.innerHTML = '<p>No history.</p>';
                return;
            }

            // Create a table with three columns: Image Link, Chat Number, Msg Number (message_link)
            const table = document.createElement('table');
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";

            // Table header
            const headerRow = document.createElement('tr');
            const thImage = document.createElement('th');
            thImage.textContent = 'Image Link';
            thImage.style.border = "1px solid #ccc";
            thImage.style.padding = "5px";
            const thChat = document.createElement('th');
            thChat.textContent = 'Chat Number';
            thChat.style.border = "1px solid #ccc";
            thChat.style.padding = "5px";
            const thMsg = document.createElement('th');
            thMsg.textContent = 'Msg Number';
            thMsg.style.border = "1px solid #ccc";
            thMsg.style.padding = "5px";
            headerRow.appendChild(thImage);
            headerRow.appendChild(thChat);
            headerRow.appendChild(thMsg);
            table.appendChild(headerRow);

            // Process each teleport_history entry
            Object.entries(teleport_history).forEach(([rawLink, chatObj]) => {
                const posts = Object.entries(chatObj);
                posts.forEach(([chat_id, tgLink], index) => {
                    const row = document.createElement('tr');
                    row.style.border = "1px solid #ccc";

                    // If this is the first row for media_url – add a cell with row spanning
                    if (index === 0) {
                        const tdImage = document.createElement('td');
                        tdImage.style.border = "1px solid #ccc";
                        tdImage.style.padding = "5px";
                        tdImage.rowSpan = posts.length;
                        const imageAnchor = document.createElement('a');
                        imageAnchor.href = rawLink;
                        imageAnchor.textContent = rawLink;
                        imageAnchor.target = "_blank";
                        tdImage.appendChild(imageAnchor);
                        row.appendChild(tdImage);
                    }

                    // Cell with chat number
                    const tdChat = document.createElement('td');
                    tdChat.style.border = "1px solid #ccc";
                    tdChat.style.padding = "5px";
                    tdChat.textContent = `chat_${chat_id}`;
                    row.appendChild(tdChat);

                    // Cell with message link (message_link) – using tgLink from previous code
                    const tdMsg = document.createElement('td');
                    tdMsg.style.border = "1px solid #ccc";
                    tdMsg.style.padding = "5px";
                    const messageLink = document.createElement('a');
                    messageLink.href = tgLink;
                    messageLink.textContent = "message_link";
                    messageLink.target = "_blank";
                    tdMsg.appendChild(messageLink);
                    row.appendChild(tdMsg);

                    table.appendChild(row);
                });
            });

            historyList.appendChild(table);
        });
    }

    // Button to clear the entire teleport_history
    clearHistoryBtn.addEventListener('click', function() {
        if (confirm("Are you sure you want to clear the entire Teleport History?")) {
            chrome.storage.sync.remove('teleport_history', function() {
                loadHistory();
            });
        }
    });
});