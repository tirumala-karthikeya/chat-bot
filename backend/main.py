from fastapi import FastAPI, HTTPException, File,UploadFile, Query, Form, WebSocket, WebSocketDisconnect
from twilio.twiml.voice_response import VoiceResponse, Gather
from fastapi.responses import FileResponse, PlainTextResponse, RedirectResponse
from pydantic import BaseModel
import requests
import shutil
from typing import List
from pathlib import Path
import logging
import os
from fastapi.middleware.cors import CORSMiddleware
import json
import re

# Initialize FastAPI app
app = FastAPI()

# Allow CORS for all origins (you can modify this to restrict specific domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you can specify the frontend domain here)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class UpdateRequest(BaseModel):
    value: str
    code: str

class GenerateHTMLRequest(BaseModel):
    filename: str
    apiKey: str

API_KEYS = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Get script directory
TEMPLATE_DIR = os.path.join(BASE_DIR, "template")

HTML_FILE = os.path.join(TEMPLATE_DIR, "index.html")
CSS_FILE = os.path.join(TEMPLATE_DIR, "style.css")
JS_FILE = os.path.join(TEMPLATE_DIR, "script.js")

FOLDER_PATH = os.path.join(BASE_DIR, "bots")  # Ensure absolute path
# Ensure the output directory exists
os.makedirs(FOLDER_PATH, exist_ok=True)

def extract_parts(filename):
    match = re.match(r"^(.*)-([a-zA-Z0-9]+)\.html$", filename)
    if match:
        name, code = match.groups()
        return name, code
    return None, None  

@app.post("/generate-html")
async def generate_html(request: GenerateHTMLRequest):
    # Change the filename handling to support the new format with slashes
    if "/" in request.filename:
        # New format: name/code
        name, code = request.filename.split("/", 1)
        filename = f"{name}-{code}.html"  # Store with hyphen but serve with slash
    else:
        # Original format: name-code
        filename = request.filename + ".html"

    output_file = os.path.join(FOLDER_PATH, filename)
    
    # Extract parts to ensure we handle the format correctly
    name, code = extract_parts(filename)
    
    global API_KEYS
    API_KEYS.setdefault(code, request.apiKey)

    # Read file contents
    try:
        with open(HTML_FILE, "r", encoding="utf-8") as f:
            html_content = f.read()
        with open(CSS_FILE, "r", encoding="utf-8") as f:
            css_content = f.read()
        with open(JS_FILE, "r", encoding="utf-8") as f:
            js_content = f.read()
    except FileNotFoundError:
        return {"error": "One or more files are missing"}

    # Merge contents
    merged_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Merged Page</title>
        <style>{css_content}</style>
    </head>
    <body>
        {html_content}
        <script>
            botName = `{name}`;
            botCode = `{code}`;
            {js_content}
        </script>
    </body>
    </html>
    """

    # Write to the user-specified file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(merged_content)

    return {"message": f"File saved at {output_file}"}

@app.delete("/delete-file/{filename}")
async def delete_file(filename: str):

    global conversation_ids
    global API_KEYS

    name, code = extract_parts(filename)

    # Remove from all dictionaries
    if code in conversation_ids:
        conversation_ids.pop(code)
    else:
        print(f"Key '{code}' not found in conversation_ids")

    if code in API_KEYS:
        API_KEYS.pop(code)
    else:
        print(f"Key '{code}' not found in api key")

    # Remove from all asset dictionaries and save updated files
    if code in chat_icon_store:
        chat_icon_store.pop(code)
        save_persistent_data(chat_icon_store, "chat_icons.json")
    else:
        print(f"Key '{code}' not found in chat icons")

    if code in bot_icon_store:
        bot_icon_store.pop(code)
        save_persistent_data(bot_icon_store, "bot_icons.json")
    else:
        print(f"Key '{code}' not found in bot icons")

    if code in bg_store:
        bg_store.pop(code)
        save_persistent_data(bg_store, "bg_images.json")
    else:
        print(f"Key '{code}' not found in bg images")
        
    if code in header_img:
        header_img.pop(code)
        save_persistent_data(header_img, "header_images.json")
    else:
        print(f"Key '{code}' not found in header images")

    if code in chatbox_text:
        chatbox_text.pop(code)
        save_persistent_data(chatbox_text, "chatbox_texts.json")
    else:
        print(f"Key '{code}' not found in chatbot text")

    if code in chat_gradient:
        chat_gradient.pop(code)
        save_persistent_data(chat_gradient, "chat_gradients.json")
    else:
        print(f"Key '{code}' not found in chat gradients")
    
    file_path = os.path.join(FOLDER_PATH, filename)

    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        os.remove(file_path)  # Delete the file
        return {"message": f"File '{filename}' deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

# Function to get all available files
def get_files():
    if not os.path.exists(FOLDER_PATH) or not os.path.isdir(FOLDER_PATH):
        return []  
    return [f for f in os.listdir(FOLDER_PATH) if os.path.isfile(os.path.join(FOLDER_PATH, f))]

# Dynamic route to serve file content with the new format (agent/name/code)
@app.get("/agent/{name}/{code}")
async def serve_file_with_agent(name: str, code: str):
    filename = f"{name}-{code}.html"
    file_path = os.path.join(FOLDER_PATH, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)

# Keep the original routes for backward compatibility
@app.get("/bot/{name}/{code}.html")
async def serve_file_with_slash(name: str, code: str):
    filename = f"{name}-{code}.html"
    file_path = os.path.join(FOLDER_PATH, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)

@app.get("/bot/{filename}")
async def serve_file(filename: str):
    file_path = os.path.join(FOLDER_PATH, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)

@app.get("/get-bots-files")  # Ensure this matches the request URL
def get_bots_files():
    
    files = get_files()
    return {"files": ", ".join(files)}

# Store the conversation_id to maintain conversation context
conversation_ids = {}

@app.websocket("/chat")
async def chatbot_websocket(websocket: WebSocket):
    
    await websocket.accept()

    try:
        data = await websocket.receive_text()
        request = json.loads(data)
        code = request.get("code", "")
        user_message = request.get("message", "")

        # Initialize conversation ID if not present
        conversation_ids.setdefault(code, "")

        logger.info(f"Received request: {request}")

        api_url = "http://api.next-agi.com/v1/chat-messages"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEYS.get(code, '')}",
        }

        payload = {
            "inputs": {},
            "query": user_message,
            "response_mode": "streaming",
            "conversation_id": conversation_ids[code],
            "user": "test-user",
            "files": [],
        }

        # Send request to external API
        response = requests.post(api_url, json=payload, headers=headers, stream=True)

        if response.status_code in [200, 201]:
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode("utf-8")
                    try:
                        event_data = json.loads(decoded_line.split("data:")[1].strip())

                        if "conversation_id" in event_data:
                            conversation_ids[code] = event_data["conversation_id"]

                        if "answer" in event_data:
                            await websocket.send_json({"answer": event_data["answer"]})  # Stream response
                    except (json.JSONDecodeError, IndexError):
                        pass
        else:
            await websocket.send_json({"error": "Error in API response"})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({"error": "Internal server error"})

    finally:
        await websocket.close()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/upload")
async def chatbot_file_upload(file: UploadFile = File(...),
    code: str = Form(...)):

    file_path = UPLOAD_DIR / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    api_url = "http://api.next-agi.com/v1/files/upload"
    
    headers = {
        "Authorization": f"Bearer {API_KEYS.get(code, '')}"
    }
    
    data = {
        "user": "test-user",  # Replace with actual user if needed
    }

    with file_path.open("rb") as f:
        files = {"file": (file.filename, f, file.content_type)}
        try:
            # Send request to external API
            response = requests.post(api_url, data=data,files=files, headers=headers)

            # Log the status
            logger.debug(f"API Response Status: {response.status_code}")
        
            if response.status_code  in [200, 201]:
                
                return response.json()

            else:
                logger.error(f"Non-200 response: {response.status_code}")
                raise HTTPException(status_code=500, detail="Error in API response")
    
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            raise HTTPException(status_code=500, detail="Error connecting to chatbot API")
    
        except requests.exceptions.JSONDecodeError:
            logger.error("Failed to parse API response as JSON")
            raise HTTPException(status_code=500, detail="Invalid JSON response from chatbot API")
    file_path.unlink()

import json
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/filechat")
async def chatbot_file_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Receive initial request payload from the client over websocket

    try:
         
        request_data = await websocket.receive_json()
        code = request_data.get("code")
        query = request_data.get("query")
        files = request_data.get("files", [])
    
        global conversation_ids
        conversation_ids.setdefault(code, "")
        logger.info(f"Received request: {request_data}")

        api_url = "http://api.next-agi.com/v1/chat-messages"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEYS.get(code, '')}"
        }
        payload = {
            "inputs": {},
            "query": query,
            "response_mode": "streaming",  # Streaming mode
            "conversation_id": conversation_ids[code],
            "user": "test-user",  # Replace as needed
            "files": [
                {
                    "type": file.get("type"),
                    "transfer_method": file.get("transfer_method"),
                    "upload_file_id": file.get("upload_file_id")
                }
                for file in files
            ]
        }

        response = requests.post(api_url, json=payload, headers=headers, stream=True)

        if response.status_code in [200, 201]:
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode("utf-8")
                    try:
                        event_data = json.loads(decoded_line.split("data:")[1].strip())

                        if "conversation_id" in event_data:
                            conversation_ids[code] = event_data["conversation_id"]

                        if "answer" in event_data:
                            await websocket.send_json({"answer": event_data["answer"]})  # Stream response
                    except (json.JSONDecodeError, IndexError):
                        pass
        else:
            await websocket.send_json({"error": "Error in API response"})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({"error": "Internal server error"})

    finally:
        await websocket.close()

@app.websocket("/urlchat")
async def chatbot_file_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Receive initial request payload from the client over websocket

    try:
         
        request_data = await websocket.receive_json()
        code = request_data.get("code")
        query = request_data.get("query")
        files = request_data.get("files", [])
    
        global conversation_ids
        conversation_ids.setdefault(code, "")
        logger.info(f"Received request: {request_data}")

        api_url = "http://api.next-agi.com/v1/chat-messages"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEYS.get(code, '')}"
        }
        payload = {
            "inputs": {},
            "query": query,
            "response_mode": "streaming",  # Streaming mode
            "conversation_id": conversation_ids[code],
            "user": "test-user",  # Replace as needed
            "files": [
                {
                    "type": file.get("type"),
                    "transfer_method": file.get("transfer_method"),
                    "url": file.get("url")
                }
                for file in files
            ]
        }

        response = requests.post(api_url, json=payload, headers=headers, stream=True)

        if response.status_code in [200, 201]:
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode("utf-8")
                    logger.debug(f"Raw API response chunk: {decoded_line}")
                    try:
                        event_data = json.loads(decoded_line.split("data:")[1].strip())

                        if "conversation_id" in event_data:
                            conversation_ids[code] = event_data["conversation_id"]

                        if "answer" in event_data:
                            await websocket.send_json({"answer": event_data["answer"]})  # Stream response
                    except (json.JSONDecodeError, IndexError):
                        pass
        else:
            await websocket.send_json({"error": "Error in API response"})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({"error": "Internal server error"})

    finally:
        await websocket.close()
    
@app.post("/twilio-voice", response_class=PlainTextResponse)
async def twilio_voice(SpeechResult: str = Form(None), speechResult: str = Form(None)):
    """Handles Twilio voice input, forwards it to the chatbot, and streams responses."""

    global conversation_id  # Maintain conversation state

    result = SpeechResult or speechResult  # Handle both variations sent by Twilio
    twiml_response = VoiceResponse()

    #logger.info(f"Received Twilio voice input: {result}")

    if result:
        # Prepare request payload for chatbot
        api_url = "http://api.next-agi.com/v1/chat-messages"
        payload = {
            "inputs": {},
            "query": result,
            "response_mode": "streaming",
            "conversation_id": conversation_id,
            "user": "test-user",  # Replace if needed
            "files": []  # No files for voice input
        }
        headers = {"Authorization": f"Bearer {API_KEYS.get(code, '')}"}

        #logger.info(f"Sending request to chatbot API with payload: {json.dumps(payload, indent=2)}")

        try:
            response = requests.post(api_url, json=payload, headers=headers, stream=True)

            #logger.debug(f"Chatbot API Response Status: {response.status_code}")

            if response.status_code in [200, 201]:
                response_text = ''

                for line in response.iter_lines():
                    if line:
                        # Log raw response line for debugging
                        decoded_line = line.decode("utf-8")
                        #logger.debug(f"Raw API response chunk: {decoded_line}")

                        try:
                            event_data = json.loads(decoded_line.split("data:")[1].strip())

                            if "conversation_id" in event_data:
                                conversation_id = event_data["conversation_id"]  # Update conversation state
                                #logger.info(f"Updated conversation_id: {conversation_id}")

                            if "answer" in event_data:
                                response_text += event_data["answer"] + " "  # Collect responses
                        except (json.JSONDecodeError, IndexError) as e:
                            logger.error(f"Error parsing response line: {decoded_line}, Error: {e}")

                response_text = response_text.strip()
                #logger.info(f"Final chatbot response: {response_text}")

                if response_text:
                    twiml_response.say(response_text)  # Speak the chatbot's response
                else:
                    twiml_response.say("I'm not sure how to respond to that.")

            else:
                #logger.error(f"Non-200 response from chatbot API: {response.status_code}")
                raise HTTPException(status_code=500, detail="Error in chatbot API response")

        except requests.exceptions.RequestException as e:
            #logger.error(f"Error calling chatbot API: {str(e)}")
            twiml_response.say("I'm having trouble connecting to my brain. Please try again later.")

    else:
        #logger.warning("No speech input received from Twilio.")
        twiml_response.say("Welcome to the virtual agent Assistant. How can I help you today?")

    # Keep the conversation open for another voice input
    gather = Gather(input="speech", action="/twilio-voice", method="POST")
    twiml_response.append(gather)

    #logger.info("Returning TwiML response.")   
    return str(twiml_response)

@app.post("/reset")
async def resetConvId(data: UpdateRequest):
    global conversation_ids
    conversation_ids[data.code] = data.value
    print( {"message": "Updated", "new_value": conversation_ids[data.code]})

# Create directory for storing persistent data
PERSISTENT_DATA_DIR = os.path.join(BASE_DIR, "persistent_data")
os.makedirs(PERSISTENT_DATA_DIR, exist_ok=True)

# Functions for loading and saving persistent data
def load_persistent_data(filename):
    filepath = os.path.join(PERSISTENT_DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error loading {filename}: {str(e)}")
    return {}

def save_persistent_data(data, filename):
    filepath = os.path.join(PERSISTENT_DATA_DIR, filename)
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f)
    except IOError as e:
        logger.error(f"Error saving {filename}: {str(e)}")

# Initialize stores from persistent data
chat_icon_store = load_persistent_data("chat_icons.json")
bot_icon_store = load_persistent_data("bot_icons.json")
bg_store = load_persistent_data("bg_images.json")
header_img = load_persistent_data("header_images.json")
chatbox_text = load_persistent_data("chatbox_texts.json")
chat_gradient = load_persistent_data("chat_gradients.json")

class ChatIconPayload(BaseModel):
    bot_code: str
    filename: str
    image_data: str

@app.post("/chatIconSave")
async def save_image(payload: ChatIconPayload):
    try:
        # Store image data in dictionary
        chat_icon_store[payload.bot_code] = payload.image_data
        # Persist to disk
        save_persistent_data(chat_icon_store, "chat_icons.json")
        return {"message": "File stored successfully", "bot_code": payload.bot_code}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing file: {str(e)}")
    
@app.get("/get_chatIcon/{bot_code}")
async def get_image(bot_code: str):
    if bot_code in chat_icon_store:
        return {"bot_code": bot_code, "image_data": chat_icon_store[bot_code]}
    else:
        raise HTTPException(status_code=404, detail="Image not found")
    
class BotIconPayload(BaseModel):
    bot_code: str
    filename: str
    image_data: str

@app.post("/botIconSave")
async def save_image(payload: BotIconPayload):
    try:
        # Store image data in dictionary
        bot_icon_store[payload.bot_code] = payload.image_data
        # Persist to disk
        save_persistent_data(bot_icon_store, "bot_icons.json")
        return {"message": "File stored successfully", "bot_code": payload.bot_code}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing file: {str(e)}")
    
@app.get("/get_botIcon/{bot_code}")
async def get_image(bot_code: str):
    if bot_code in bot_icon_store:
        return {"bot_code": bot_code, "image_data": bot_icon_store[bot_code]}
    else:
        raise HTTPException(status_code=404, detail="Image not found")
    
class BGImagePayload(BaseModel):
    code: str
    image: str

@app.post("/bgSave")
async def save_image(payload: BGImagePayload):
    try:
        # Store image data in dictionary
        bg_store[payload.code] = payload.image
        # Persist to disk
        save_persistent_data(bg_store, "bg_images.json")
        return {"message": "File stored successfully", "bot_code": payload.code}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing file: {str(e)}")
    
@app.get("/get_bg/{bot_code}")
async def get_image(bot_code: str):
    if bot_code in bg_store:
        return {"bot_code": bot_code, "image_data": bg_store[bot_code]}
    else:
        raise HTTPException(status_code=404, detail="Image not found")
    
class headerImg(BaseModel):
    code: str
    image: str
    
class chatboxtext(BaseModel):
    text: str
    code: str

@app.post("/headerImg")
async def save_input1(input_data: headerImg):
    header_img[input_data.code] = input_data.image
    # Persist to disk
    save_persistent_data(header_img, "header_images.json")
    return {"message": "Header image saved", "data": header_img}

@app.post("/chatboxtext")
async def save_input2(input_data: chatboxtext):
    chatbox_text[input_data.code] = input_data.text
    # Persist to disk
    save_persistent_data(chatbox_text, "chatbox_texts.json")
    return {"message": "Chatbox text saved", "data": chatbox_text}

@app.get("/header_img/{bot_code}")
async def get_image(bot_code: str):
    if bot_code in header_img:
        return {"bot_code": bot_code, "data": header_img[bot_code]}
    else:
        raise HTTPException(status_code=404, detail="Image not found")

@app.get("/chatbox_text/{bot_code}")
async def get_image(bot_code: str):
    if bot_code in chatbox_text:
        return {"bot_code": bot_code, "data": chatbox_text[bot_code]}
    else:
        raise HTTPException(status_code=404, detail="Image not found")

class chatgradient(BaseModel):
    gradient: str
    code: str

@app.post("/chatgradient")
async def save_gradient(input_data: chatgradient):
    chat_gradient[input_data.code] = input_data.gradient
    # Persist to disk
    save_persistent_data(chat_gradient, "chat_gradients.json")
    return {"message": "Chat gradient saved", "data": chat_gradient}

@app.get("/chat_gradient/{bot_code}")
async def get_gradient(bot_code: str):
    if bot_code in chat_gradient:
        return {"bot_code": bot_code, "data": chat_gradient[bot_code]}
    else:
        raise HTTPException(status_code=404, detail="Image not found")