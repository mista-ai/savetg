from telethon import TelegramClient, events
from telethon.tl.types import User
import p_data


class TelegramBot:
    def __init__(self, api_id, api_hash, bot_token):
        # Initialize Telethon client
        self.app_bot = TelegramClient("tg_saver_bot", api_id, api_hash).start(bot_token=bot_token)

        # Register message handlers
        self._register_handlers()

    def _register_handlers(self):
        # Handler for retrieving chat IDs
        self.app_bot.add_event_handler(self.get_chat_id, events.NewMessage(pattern='/get_id'))

        # Handler for retrieving metadata about a group or channel
        self.app_bot.add_event_handler(self.get_chat_meta, events.NewMessage(pattern='/get_meta'))

        # Handler for retrieving metadata about a group or channel
        self.app_bot.add_event_handler(self.get_start, events.NewMessage(pattern='/start'))

        # Handler for retrieving metadata about a group or channel
        self.app_bot.add_event_handler(self.get_info, events.NewMessage(pattern='/info'))

    @staticmethod
    def _correct_chat_id(event):
        """Corrects chat_id based on the type of chat"""
        chat_id = event.chat.id

        # Check if this is a private chat with a user
        if isinstance(event.chat, User):
            chat_title = event.chat.first_name  # Or event.chat.username, if available
        else:
            chat_title = event.chat.title

        if hasattr(event.chat, 'megagroup') and event.chat.megagroup:
            is_supergroup = True
        else:
            is_supergroup = False

        if hasattr(event.chat, 'broadcast') and event.chat.broadcast:
            is_channel = True
        else:
            is_channel = False

        if is_channel or is_supergroup:
            chat_id = f"-100{abs(chat_id)}"

        return chat_id, chat_title

    async def send_message(self, chat_id, text):
        """Send a message via Telethon"""
        await self.app_bot.send_message(chat_id, text)

    async def get_start(self, event):
        """Retrieves chat_id and adds it to the database"""
        chat_id, chat_title = self._correct_chat_id(event)
        await event.respond(
            f"Chat ID:\n{chat_id}\nChat name:\n{chat_title}\n\n"
            f'1. Copy your Chat ID (sent by the bot) or type /get_id (/get_meta).'
            f'\n2. Enter this Chat ID and a name in the "Chats" section, then press Save.'
            f'\n3. Now, you can send media to yourself.' 
            '\n\n**Adding a Channel**'
            '\n1. Open your Telegram Channel.'
            '\n2. Add the bot as an admin.'
            '\n3. Type /get_id or /get_meta in the channel (or check the Info section).'
            '\n4. Copy the Channel ID (starts with -100).'
            '\n5. Enter this Channel ID and a name in the "Chats" section, then press Save.'
            '\n**Note**: The bot must be added to the group/channel before it can receive media.')

    async def get_chat_id(self, event):
        """Retrieves chat_id and adds it to the database"""
        chat_id, chat_title = self._correct_chat_id(event)
        await event.respond(f"Chat ID of this chat is:\n{chat_id}")

    async def get_chat_meta(self, event):
        """Retrieves metadata (ID and name) of the chat"""
        chat_id, chat_title = self._correct_chat_id(event)
        await event.respond(f"Chat ID:\n{chat_id}\nChat name:\n{chat_title}")

    async def get_info(self, event):
        """Retrieves metadata (ID and name) of the chat"""
        chat_id, chat_title = self._correct_chat_id(event)
        await event.respond(f'''How to Add a Chat?

Adding a Personal Chat (Yourself)
1. Copy your Chat ID (sent by the bot) or type /get_id (/get_meta).
2. Enter this Chat ID and a name in the "Chats" section, then press Save.
3. Now, you can send media to yourself.

Adding a Channel
1. Open your Telegram Channel.
2. Add the bot as an admin.
3. Type /get_id or /get_meta in the channel (or check the Info section).
4. Copy the Channel ID (starts with -100).
5. Enter this Channel ID and a name in the "Chats" section, then press Save.
Note: The bot must be added to the group/channel before it can receive media.

How to Enable Upload History?
1. Navigate to the "History" section.
2. Click "Save History."
3. Once enabled, you will not be able to upload the same file to the same chat twice.

How to Send Media?
- Click the "Save" button when hovering over media.
- Or, use the context menu by right-clicking on media and selecting the appropriate option.
''')


if __name__ == '__main__':
    # Create an instance of TelegramBot
    bot = TelegramBot(p_data.api_id, p_data.api_hash, p_data.bot_token)

    # Start the Telethon client
    bot.app_bot.run_until_disconnected()
