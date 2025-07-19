# WhatsApp Message Scheduler 🕒

A Node.js + Express.js + WhatsApp Web-based message scheduler with a user-friendly frontend to send scheduled messages to individuals and groups via WhatsApp.

> 💡 Built using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)

---

## 🚀 Features

- 🧾 Web interface for scheduling messages (no need to manually edit JSON)
- 📱 Schedule WhatsApp messages to individuals or groups
- 🕐 Set date and time (IST) for messages with minute-level precision
- 🔐 Secure WhatsApp authentication using QR code
- 💾 Persistent sessions (scan QR once)
- ✅ Tracks sent vs pending messages in real time
- 📤 Automatically logs sent messages to `sent-log.json`
- ➕ Schedule multiple messages at once

---

## 🛠 Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- WhatsApp account (logged in on your mobile device)
- Internet connection

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-scheduler.git
   cd whatsapp-scheduler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create empty schedule and log files**

   On macOS/Linux:
   ```bash
   echo "[]" > schedule.json
   echo "[]" > sent-log.json
   ```

   On Windows (PowerShell):
   ```powershell
   New-Item schedule.json -ItemType File; Set-Content schedule.json "[]"
   New-Item sent-log.json -ItemType File; Set-Content sent-log.json "[]"
   ```

---

## ▶️ Usage

### 1. Start the scheduler

```bash
npm start
```

Or in development mode (auto-reloads on changes):

```bash
npm run dev
```

### 2. Scan the QR Code

- Open WhatsApp > Linked Devices
- Scan the QR code displayed in your terminal
- Once authenticated, the bot is ready to send messages

---

## 🌐 Web Interface

Once running, visit:

👉 [http://localhost:3000](http://localhost:3000)

From the web interface you can:

- 📝 Fill out a form to schedule multiple messages at once
- 👤 Choose between individual or group messages
- 📆 Use date and time pickers (in IST timezone)
- 📊 View all scheduled messages in a live table
- ✅ See real-time status updates for sent/pending messages

---

## 📂 Message Format

### In `schedule.json` (used by the backend):

```json
{
  "type": "individual",
  "recipient": "919123456789",
  "message": "Hello there!",
  "time": "2025-07-18T14:00:00.000Z",
  "sent": false,
  "createdAt": "2025-07-18T13:55:00.000Z"
}
```

Once sent, it will be copied into `sent-log.json` like this:

```json
{
  "type": "group",
  "recipient": "My Group",
  "message": "Meeting starts now!",
  "time": "2025-07-18T15:00:00.000Z",
  "sent": true,
  "createdAt": "2025-07-18T14:50:00.000Z",
  "sentAt": "2025-07-18T15:00:01.000Z"
}
```

---

## 📞 Phone & Group Formats

### ✅ Individual
- Use full international format without `+`
  - ✅ Correct: `919123456789`
  - ❌ Wrong: `+91 9123456789`

### ✅ Group
- Use **exact group name** (case-insensitive)
- Make sure the bot account is a member of the group

---

## 🧠 How It Works

- Scheduler checks `schedule.json` every minute
- If a message is due and not sent:
  - It sends the message via WhatsApp
  - Marks it as `"sent": true`
  - Moves it to `sent-log.json`
  - Removes it from the live schedule list

---

## 📊 Live Status in Frontend

- Messages in the dashboard show:
  - ✅ Sent
  - ⏳ Pending
- This status auto-refreshes every 10 seconds

---

## 📁 Project Structure

```
whatsapp-scheduler/
├── index.js             # Main backend and scheduler logic
├── schedule.json        # Future messages to be sent
├── sent-log.json        # Archive of already sent messages
├── session_data/        # WhatsApp session data (auto-generated)
├── public/
│   └── index.html       # Web interface frontend
├── package.json         # Dependencies and scripts
└── README.md
```

---

## ❗ Troubleshooting

### QR not showing?
- Try in a different terminal (VS Code, CMD, PowerShell)
- Delete `session_data/` and restart

### Messages not being sent?
- Check phone number format
- Confirm group name is exact
- Ensure time is set in the **future** (UTC format or via frontend)

### Group not found?
- Double-check name spelling
- Ensure the bot is added to the group

---

## 🔐 Security Tips

- Never share your `session_data/` folder
- Use firewall rules if deploying this online
- Add basic auth or login if making the web interface public

---

## 📈 Roadmap

- [x] Frontend UI for scheduling messages
- [x] Sent messages log
- [x] Real-time status updates
- [ ] Recurring message support (daily/weekly)
- [ ] Media attachments (images, PDFs)
- [ ] Google Sheets or CSV import
- [ ] Multi-account support
- [ ] Dark mode UI

---

## 🧑‍💻 Contributing

1. Fork this repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request!

---

## 📜 License

This project is licensed under the [MIT License](LICENSE)

---

## ⚠️ Disclaimer

This project is not affiliated with WhatsApp or Meta. Use it responsibly and in accordance with WhatsApp’s Terms of Service. The author is not responsible for misuse.

---

## ⭐ Like it?

Star the repo on GitHub to support the project!
