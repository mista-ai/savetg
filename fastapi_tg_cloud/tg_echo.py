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

    async def get_chat_id(self, event):
        """Retrieves chat_id and adds it to the database"""
        chat_id, chat_title = self._correct_chat_id(event)
        await event.respond(f"Chat ID of this chat is:\n{chat_id}")

    async def get_chat_meta(self, event):
        """Retrieves metadata (ID and name) of the chat"""
        chat_id, chat_title = self._correct_chat_id(event)
        await event.respond(f"Chat ID:\n{chat_id}\nChat name:\n{chat_title}")


if __name__ == '__main__':
    # Create an instance of TelegramBot
    bot = TelegramBot(p_data.api_id, p_data.api_hash, p_data.bot_token)

    # Start the Telethon client
    bot.app_bot.run_until_disconnected()
