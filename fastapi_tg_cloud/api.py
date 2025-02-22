from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from bot import TelegramBot
import p_data

bot = TelegramBot(p_data.bot_token)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ FastAPI server started!")
    yield
    print("❌ FastAPI server stopped!")


app = FastAPI(lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/fetch_and_send_to_telegram")
async def fetch_and_send_to_telegram(request: dict):
    try:
        # Check that the required fields are present
        if "chat_id" not in request or "media_url" not in request:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Missing required parameters",
                    "message": "Both 'chat_id' and 'media_url' are required.",
                    "received_data": request
                }
            )

        chat_id = request.get("chat_id")
        media_url = request.get("media_url")
        msg_text = request.get("msg_text", "").strip()  # If absent or empty, it will be an empty string

        # Check that media_url is of type str
        if not isinstance(media_url, str):
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Invalid type",
                    "message": f"Expected 'media_url' as str, got {type(media_url).__name__}.",
                    "received_data": request
                }
            )

        print(f"📩 Received request: chat_id={chat_id}, media_url={media_url}, msg_text={msg_text}")

        # If msg_text is present, use the method for sending with a caption;
        # otherwise, send media without text.
        if msg_text:
            # This method should be implemented in TelegramBot and support passing a caption
            response = await bot.send_media_with_caption(chat_id, media_url, msg_text)
        else:
            response = await bot.send_media(chat_id, media_url)

        if "error" in response:
            print(f"❌ Error sending media: {response['error']}")
            raise HTTPException(status_code=400, detail=response)

        print(response)
        return response

    except HTTPException as e:
        print(f"❌ Error: {e.detail}")
        raise e

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Server error",
                "message": str(e),
                "received_data": request
            }
        )


@app.post("/send_text_to_telegram")
async def send_text_to_telegram(request: dict):
    try:
        if "chat_id" not in request or "text" not in request:
            raise HTTPException(
                status_code=400,
                detail={"error": "Missing required parameters", "message": "Both 'chat_id' and 'text' are required."}
            )

        chat_id = request["chat_id"]
        text = request["text"]

        print(f"📩 Sending text to chat {chat_id}: {text}")

        response = await bot.send_request("sendMessage", {"chat_id": chat_id, "text": text})

        if "error" in response:
            raise HTTPException(status_code=400, detail=response)

        return response

    except HTTPException as e:
        print(f"❌ Error: {e.detail}")
        raise e

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Server error", "message": str(e)}
        )


if __name__ == '__main__':
    import uvicorn

    uvicorn.run("api:app", host="127.0.0.1", port=5000, reload=True)
