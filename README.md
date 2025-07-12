# WhatsApp Message Scheduler

A Node.js application that allows you to schedule WhatsApp messages to individuals and groups using the whatsapp-web.js library.

## Features

- 📅 Schedule messages to individuals and groups
- 🔄 Automatic message sending at specified times
- 💾 Persistent session storage (no need to scan QR code repeatedly)
- 📱 Support for both individual contacts and group chats
- ⏰ Real-time message scheduling with minute-level precision
- 🛡️ Graceful error handling and logging
- 🔐 Secure authentication using WhatsApp Web

## Prerequisites

- Node.js (version 14.0.0 or higher)
- npm (Node Package Manager)
- WhatsApp account
- Active internet connection

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/whatsapp-scheduler.git
   cd whatsapp-scheduler
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a schedule file:**
   The application will automatically create a `schedule.json` file on first run, but you can create it manually if needed.

## Usage

### Starting the Application

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### First Time Setup

1. Run the application
2. Scan the QR code with your WhatsApp mobile app
3. The application will authenticate and start monitoring for scheduled messages

### Adding Scheduled Messages

Edit the `schedule.json` file to add your scheduled messages:

```json
[
  {
    "type": "individual",
    "recipient": "+1234567890",
    "message": "Hello! This is a scheduled message.",
    "time": "2025-07-12 14:30",
    "sent": false
  },
  {
    "type": "group",
    "recipient": "Family Group",
    "message": "Don't forget our meeting today!",
    "time": "2025-07-12 09:00",
    "sent": false
  }
]
```

### Message Format

Each message object should contain:
- `type`: Either "individual" or "group"
- `recipient`: Phone number (with country code) for individuals, or exact group name for groups
- `message`: The text message to send
- `time`: When to send the message (YYYY-MM-DD HH:MM format)
- `sent`: Boolean indicating if the message has been sent (automatically updated)

### Phone Number Format

For individual messages, use international format:
- Include country code (e.g., +1 for US, +91 for India)
- Example: "+1234567890" or "1234567890"
- The app will automatically format Indian numbers if no country code is provided

### Group Messages

For group messages:
- Use the exact group name as it appears in WhatsApp
- The group name matching is case-insensitive
- Make sure the bot account is a member of the group

## Project Structure

```
whatsapp-scheduler/
├── index.js              # Main application file
├── package.json          # Project dependencies and scripts
├── schedule.json         # Scheduled messages (auto-created)
├── session_data/         # WhatsApp session data (auto-created)
├── README.md            # This file
└── .gitignore           # Git ignore file
```

## Configuration

### Default Settings

- **Check Interval**: 60 seconds (1 minute)
- **Time Window**: Messages are sent within 1 minute of scheduled time
- **Country Code**: Default is India (+91) for numbers without country code
- **Session Path**: `./session_data`

### Customization

You can modify these settings in the `WhatsAppScheduler` constructor:

```javascript
this.checkInterval = 60000; // Check every minute
this.scheduleFile = './schedule.json'; // Schedule file path
```

## Troubleshooting

### Common Issues

1. **QR Code doesn't appear**
   - Make sure your terminal supports QR code display
   - Check if port 3000 is available

2. **Authentication fails**
   - Delete the `session_data` folder and restart
   - Ensure your WhatsApp account is active

3. **Messages not sending**
   - Check if phone numbers are in correct format
   - Verify group names are exact matches
   - Ensure scheduled time is in the future

4. **Group not found**
   - Make sure the bot account is a member of the group
   - Check group name spelling and case

### Logs

The application provides detailed logging:
- ✅ Success messages
- ❌ Error messages
- 🔍 Debug information
- 📤 Message sending status

## Security Considerations

- Keep your `session_data` folder secure
- Don't share your session files
- Use environment variables for sensitive data in production
- Be mindful of WhatsApp's terms of service

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project is not affiliated with WhatsApp or Meta. Use responsibly and in accordance with WhatsApp's Terms of Service. The authors are not responsible for any misuse of this software.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section
2. Open an issue on GitHub
3. Provide detailed error logs and system information

## Roadmap

- [ ] Web interface for managing scheduled messages
- [ ] Google Sheets integration
- [ ] Message templates
- [ ] Recurring messages
- [ ] Message delivery reports
- [ ] Multiple WhatsApp account support

---

⭐ If you find this project helpful, please give it a star on GitHub!
