Here is the complete, copy-paste-ready `README.md` content for your GitHub repository:

---

````markdown
# WhatsApp Message Scheduler 🕒

A Node.js + Express.js + WhatsApp Web-based message scheduler with a user-friendly frontend to send scheduled messages to individuals and groups via WhatsApp.

> 💡 Built using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)

---

## 🚀 Features

- 🧾 **Web Interface** for scheduling messages (no editing JSON manually)
- 📱 Schedule WhatsApp messages to **individuals or groups**
- 🕐 Set **date and time** (IST local) with real-time scheduling precision
- 🔐 Secure WhatsApp authentication via QR
- 💾 Persistent sessions (you scan once, and you're done)
- ✅ Tracks **sent** vs **pending** messages
- 📤 Logs all sent messages into `sent-log.json`
- 🧠 Supports multiple message entries at once

---

## 🛠 Prerequisites

- Node.js v14 or higher
- npm (Node Package Manager)
- WhatsApp account (logged into your phone)
- Internet connection

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-scheduler.git
   cd whatsapp-scheduler
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create empty schedule and log files**

   ```bash
   echo "[]" > schedule.json
   echo "[]" > sent-log.json
   ```

   > On Windows (PowerShell), use:

   ```powershell
   New-Item -Path . -Name "schedule.json" -ItemType "File"; Set-Content -Path schedule.json -Value "[]"
   New-Item -Path . -Name "sent-log.json" -ItemType "File"; Set-Content -Path sent-log.json -Value "[]"
   ```

---

## ▶️ Usage

### 1. Start the app

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 2. Authenticate WhatsApp

* Open your terminal and **scan the QR code** using WhatsApp > Linked Devices
* You’ll stay logged in as long as `session_data/` folder is intact

---

## 🌐 Web Interface

Once running, visit:
👉 [http://localhost:3000](http://localhost:3000)

### You can:

* ✅ Add multiple messages in one go
* ✍️ Select individual/group type
* 📅 Pick date & time using a calendar/time input
* 📄 View all **scheduled messages** in a table
* 🔁 See live status: ✅ Sent or ⏳ Pending

---

## 📂 Message Format (JSON)

Messages are stored in `schedule.json` like this:

```json
{
  "type": "individual",
  "recipient": "919123456789",
  "message": "Good morning!",
  "time": "2025-07-19T07:00:00.000Z",
  "sent": false,
  "createdAt": "2025-07-19T06:50:00.000Z"
}
```

After being sent, they’re logged in `sent-log.json`:

```json
{
  "type": "group",
  "recipient": "Trip when",
  "message": "YES",
  "time": "2025-07-19T06:40:00.000Z",
  "sent": true,
  "createdAt": "2025-07-19T06:39:21.285Z",
  "sentAt": "2025-07-19T06:40:47.341Z"
}
```

---

## 📞 Phone & Group Formats

### ✅ Individual

* Use international format: `919123456789` (no `+`)
* Auto-handles formatting (adds `@c.us` internally)

### ✅ Group

* Use **exact group name** as seen in WhatsApp
* Bot must be a member of the group

---

## 🧠 How It Works

* Checks `schedule.json` every minute
* If `message.time <= current time` and not sent:

  * Sends message using `whatsapp-web.js`
  * Updates status as `"sent": true`
  * Logs into `sent-log.json`
  * Removes it from `schedule.json` (clean-up)

---

## 🔐 Security Tips

* Keep `session_data/` safe (don’t commit to GitHub)
* Don’t expose on public servers without auth
* Only send messages in line with WhatsApp's terms

---

## 🧪 Project Structure

```
whatsapp-scheduler/
├── index.js             # Main scheduler + backend API
├── schedule.json        # Future messages to be sent
├── sent-log.json        # History of all sent messages
├── session_data/        # WhatsApp session data
├── public/
│   └── index.html       # Web interface (frontend)
├── package.json
└── README.md
```

---

## ❗ Troubleshooting

### QR not showing?

* Use a supported terminal
* Delete `session_data/` and restart

### Message not sending?

* Check time format is valid ISO or use the frontend
* Make sure phone number has correct country code
* Group name must be exact (and bot must be in the group)

---

## 📈 Roadmap

* [x] Frontend for message scheduling
* [x] Support for multiple messages at once
* [x] Message delivery log
* [ ] Drag to reorder messages
* [ ] Scheduled media (image/file)
* [ ] Google Sheets integration
* [ ] Recurring messages (e.g. daily, weekly)

---

## 🧑‍💻 Contributing

1. Fork this repo
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request!

---

## 📜 License

MIT License — see the [LICENSE](LICENSE) file.

---

## 🚨 Disclaimer

This is **not affiliated with WhatsApp or Meta**. Use this project responsibly and comply with all legal & ethical standards.
The developer is **not responsible for misuse** of this tool.

---

## ⭐ Like this project?

Give it a star ⭐ on GitHub — it helps others discover it and motivates further development!

```
