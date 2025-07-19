const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

class WhatsAppScheduler {
    constructor(options = {}) {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "whatsapp-scheduler",
                dataPath: "./session_data"
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.scheduleFile = './schedule.json';
        this.sentLogFile = './sent-log.json';
        this.checkInterval = 60000; // 1 minute
        this.intervalId = null;

        this.defaultCountryCode = options.defaultCountryCode || null;
        this.requireCountryCode = options.requireCountryCode !== false;

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('🔗 Scan the QR code below to authenticate:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp authenticated successfully!');
        });

        this.client.on('ready', () => {
            console.log('🚀 WhatsApp client is ready!');
            this.startScheduler();
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('📡 WhatsApp disconnected:', reason);
            this.stopScheduler();
        });
    }

    async start() {
        try {
            console.log('🔄 Starting WhatsApp scheduler...');
            await this.ensureFile(this.scheduleFile);
            await this.ensureFile(this.sentLogFile);
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Error starting WhatsApp scheduler:', error);
        }
    }

    async stop() {
        console.log('🛑 Stopping WhatsApp scheduler...');
        this.stopScheduler();
        await this.client.destroy();
    }

    async ensureFile(filePath) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify([], null, 2));
            console.log(`📄 Created ${filePath}`);
        }
    }

    startScheduler() {
        console.log('⏰ Starting message scheduler (checking every minute)...');
        this.checkScheduledMessages();
        this.intervalId = setInterval(() => {
            this.checkScheduledMessages();
        }, this.checkInterval);
    }

    stopScheduler() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏰ Message scheduler stopped');
        }
    }

    async checkScheduledMessages() {
        try {
            const messages = await this.loadScheduledMessages();
            const currentTime = new Date();
            let hasUpdates = false;

            console.log(`🔍 Checking ${messages.length} scheduled messages...`);
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];

                if (message.sent) continue;
                if (!this.validateMessageData(message)) continue;

                if (this.shouldSendMessage(message, currentTime)) {
                    console.log(`📤 Sending message to ${message.recipient}...`);
                    const success = await this.sendMessage(message);

                    if (success) {
                        const sentMessage = {
                            ...message,
                            sent: true,
                            sentAt: new Date().toISOString()
                        };
                        await this.appendToSentLog(sentMessage);
                        messages[i].sent = true;
                        messages[i].sentAt = new Date().toISOString();

                        hasUpdates = true;
                        console.log(`✅ Sent to ${message.recipient}`);
                    } else {
                        console.log(`❌ Failed to send to ${message.recipient}`);
                    }
                }
            }

            if (hasUpdates) {
                console.log('🔄 Saving updated scheduled messages...');
                await this.saveScheduledMessages(messages); // Save everything (sent + pending)
                console.log('✅ Scheduled messages updated');
                await this.saveScheduledMessages(pendingMessages);
            }

        } catch (error) {
            console.error('❌ Error in scheduler:', error);
        }
    }

    validateMessageData(message) {
        const required = ['type', 'recipient', 'message', 'time'];
        const hasAll = required.every(field => message.hasOwnProperty(field));
        if (!hasAll) {
            console.error('❌ Missing fields in message:', message);
            return false;
        }
        if (!['individual', 'group'].includes(message.type)) {
            console.error('❌ Invalid type:', message.type);
            return false;
        }
        return true;
    }

    shouldSendMessage(message, currentTime) {
        try {
            const scheduledTime = new Date(message.time);
            const diff = Math.abs(currentTime - scheduledTime);
            return diff <= 60000 && currentTime >= scheduledTime;
        } catch {
            return false;
        }
    }

    async sendMessage(message) {
        try {
            let chatId;
            if (message.type === 'individual') {
                chatId = await this.formatPhoneNumber(message.recipient);
            } else if (message.type === 'group') {
                chatId = await this.findGroupByName(message.recipient);
            }

            if (!chatId) return false;

            await this.client.sendMessage(chatId, message.message);
            return true;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            return false;
        }
    }

    async formatPhoneNumber(phoneNumber) {
        let clean = phoneNumber.replace(/\D/g, '');
        if (clean.length >= 11) return clean + '@c.us';
        if (clean.length === 10 && this.defaultCountryCode)
            return this.defaultCountryCode + clean + '@c.us';
        if (clean.length < 10) return null;
        if (this.requireCountryCode && clean.length === 10) return null;
        return clean + '@c.us';
    }

    async findGroupByName(name) {
        const chats = await this.client.getChats();
        const group = chats.find(c => c.isGroup && c.name.toLowerCase() === name.toLowerCase());
        return group ? group.id._serialized : null;
    }

    async loadScheduledMessages() {
        try {
            const data = await fs.readFile(this.scheduleFile, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    async saveScheduledMessages(messages) {
        try {
            await fs.writeFile(this.scheduleFile, JSON.stringify(messages, null, 2));
        } catch (error) {
            console.error('❌ Error saving scheduled messages:', error);
        }
    }

    async appendToSentLog(message) {
        try {
            const file = await fs.readFile(this.sentLogFile, 'utf8');
            const parsed = JSON.parse(file);
            parsed.push(message);
            await fs.writeFile(this.sentLogFile, JSON.stringify(parsed, null, 2));
        } catch (error) {
            console.error('❌ Error logging sent message:', error);
        }
    }

    async addScheduledMessage(data) {
        try {
            if (!this.validateMessageData(data)) throw new Error('Invalid data');
            const messages = await this.loadScheduledMessages();
            messages.push({
                ...data,
                sent: false,
                createdAt: new Date().toISOString()
            });
            await this.saveScheduledMessages(messages);
            console.log('✅ Scheduled message added');
        } catch (error) {
            console.error('❌ Error adding message:', error);
        }
    }

    async getStats() {
        const messages = await this.loadScheduledMessages();
        return {
            total: messages.length,
            sent: messages.filter(m => m.sent).length,
            pending: messages.filter(m => !m.sent).length,
            individual: messages.filter(m => m.type === 'individual').length,
            group: messages.filter(m => m.type === 'group').length
        };
    }
}

// Main runner
async function main() {
    const options = {
        // defaultCountryCode: '91',
        // requireCountryCode: true
    };

    const scheduler = new WhatsAppScheduler(options);

    process.on('SIGINT', async () => {
        console.log('\n🛑 Graceful shutdown...');
        await scheduler.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Graceful shutdown...');
        await scheduler.stop();
        process.exit(0);
    });

    await scheduler.start();
}

// Expose APIs + Web UI
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/api/messages', async (req, res) => {
    const scheduler = new WhatsAppScheduler();
    const messages = await scheduler.loadScheduledMessages();
    res.json(messages);
});

app.post('/api/messages', async (req, res) => {
    const scheduler = new WhatsAppScheduler();
    await scheduler.addScheduledMessage(req.body);
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`🌐 Web UI running at http://localhost:${PORT}`);
});

// Start scheduler if running as main script
if (require.main === module) {
    main().catch(console.error);
}
