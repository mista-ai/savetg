import httpx
import asyncio


class TelegramBot:
    def __init__(self, token: str):
        self.token = token
        self.client = httpx.AsyncClient()

    async def send_request(self, method: str, data: dict):
        """Send a request with error handling for bot permissions and chat status"""
        url = f"https://api.telegram.org/bot{self.token}/{method}"
        max_retries = 5

        for attempt in range(max_retries):
            response = await self.client.post(url, json=data)
            response_json = response.json()

            if response.status_code == 200 and response_json.get("ok"):
                result = response_json.get("result", {})
                message_id = result.get("message_id")
                res_chat_id = (str(result.get("chat", {}).get("id"))
                               .replace('-100', '').replace('-', ''))
                return {
                    "message": f"{method} sent successfully to Telegram.",
                    "link": f"https://t.me/c/{res_chat_id}/{message_id}"
                }

            elif response.status_code == 400:
                return {"error": f"Bad request: {response_json.get('description', 'Unknown error')}"}

            elif response.status_code == 403:
                return {"error": "⚠ Bot lacks permission or is not in the chat."}

            elif response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
                print(f"Too Many Requests: Waiting {retry_after} sec")
                await asyncio.sleep(retry_after)

            else:
                return {"error": f"Unexpected error: {response_json}"}

        return await self.send_failure_notification(data["chat_id"], data)

    async def send_failure_notification(self, chat_id: int, data: dict):
        """Notifies the user if the bot fails to send media"""
        text_message = {
            "chat_id": chat_id,
            "text": f"⚠ Failed to send file: {data}"
        }
        await self.client.post(f"https://api.telegram.org/bot{self.token}/sendMessage", json=text_message)

    async def send_media(self, chat_id: int, media_url: str):
        """Determines media type and sends the appropriate request"""
        media_type = self._detect_media_type(media_url)

        method_mapping = {
            "photo": "sendPhoto",
            "animation": "sendAnimation",
            "video": "sendVideo",
            "document": "sendDocument",
        }

        method = method_mapping.get(media_type, "sendVideo")  # Default to video if unknown
        print(f"📤 Sending {media_type}: {media_url}")

        return await self.send_request(
            method,
            {"chat_id": chat_id, method.split("send")[-1].lower(): media_url}
        )

    async def send_media_with_caption(self, chat_id: int, media_url: str, caption: str):
        """Sends media with a caption (if provided)

        Determines the media type and sends a request with an additional 'caption' parameter.
        """
        media_type = self._detect_media_type(media_url)
        method_mapping = {
            "photo": "sendPhoto",
            "animation": "sendAnimation",
            "video": "sendVideo",
            "document": "sendDocument",
        }
        method = method_mapping.get(media_type, "sendVideo")
        print(f"📤 Sending {media_type} with caption: {media_url} | {caption}")
        # Key for media: 'photo', 'animation', 'video', or 'document'
        media_key = method.split("send")[-1].lower()
        return await self.send_request(
            method,
            {"chat_id": chat_id, media_key: media_url, "caption": caption}
        )

    @staticmethod
    def _detect_media_type(url: str) -> str:
        """Improved media detection to avoid format conflicts"""
        ext = url.split("?")[0].split(".")[-1].lower()
        query_params = url.split("?")[-1] if "?" in url else ""

        if ext in ("webp", "gif") and "format=mp4" in query_params:
            return "video"  # Handle cases where GIF is actually MP4

        if ext in ("gif", "gifv"):
            return "animation"
        elif ext in ("mp4", "avi", "mov", "wmv", "flv", "mkv"):
            return "video"
        elif ext in ("zip", "rar", "7z", "pdf", "docx"):
            return "document"

        return "photo"
