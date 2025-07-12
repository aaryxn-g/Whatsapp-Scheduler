const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');

class WhatsAppScheduler {
    constructor() {
        // Initialize WhatsApp client with session persistence
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
        this.checkInterval = 60000; // 1 minute in milliseconds
        this.intervalId = null;
        
        this.setupEventHandlers();
    }

    /**
     * Set up WhatsApp client event handlers
     */
    setupEventHandlers() {
        // Display QR code for initial authentication
        this.client.on('qr', (qr) => {
            console.log('🔗 Scan the QR code below to authenticate:');
            qrcode.generate(qr, { small: true });
        });

        // Handle successful authentication
        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp authenticated successfully!');
        });

        // Handle ready state
        this.client.on('ready', () => {
            console.log('🚀 WhatsApp client is ready!');
            this.startScheduler();
        });

        // Handle authentication failure
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
        });

        // Handle disconnection
        this.client.on('disconnected', (reason) => {
            console.log('📡 WhatsApp disconnected:', reason);
            this.stopScheduler();
        });
    }

    /**
     * Initialize and start the WhatsApp client
     */
    async start() {
        try {
            console.log('🔄 Starting WhatsApp scheduler...');
            await this.ensureScheduleFile();
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Error starting WhatsApp scheduler:', error);
        }
    }

    /**
     * Stop the scheduler and destroy the client
     */
    async stop() {
        console.log('🛑 Stopping WhatsApp scheduler...');
        this.stopScheduler();
        await this.client.destroy();
    }

    /**
     * Ensure the schedule.json file exists
     */
    async ensureScheduleFile() {
        try {
            await fs.access(this.scheduleFile);
        } catch (error) {
            // File doesn't exist, create it with empty array
            const initialData = [];
            await fs.writeFile(this.scheduleFile, JSON.stringify(initialData, null, 2));
            console.log('📄 Created initial schedule.json file');
        }
    }

    /**
     * Start the message scheduler
     */
    startScheduler() {
        console.log('⏰ Starting message scheduler (checking every minute)...');
        
        // Check immediately, then every minute
        this.checkScheduledMessages();
        this.intervalId = setInterval(() => {
            this.checkScheduledMessages();
        }, this.checkInterval);
    }

    /**
     * Stop the message scheduler
     */
    stopScheduler() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏰ Message scheduler stopped');
        }
    }

    /**
     * Check for scheduled messages that need to be sent
     */
    async checkScheduledMessages() {
        try {
            const messages = await this.loadScheduledMessages();
            const currentTime = new Date();
            let hasUpdates = false;

            console.log(`🔍 Checking ${messages.length} scheduled messages...`);

            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                
                // Skip if already sent
                if (message.sent) continue;

                // Check if it's time to send this message
                if (this.shouldSendMessage(message, currentTime)) {
                    console.log(`📤 Sending scheduled message to ${message.recipient}...`);
                    
                    const success = await this.sendMessage(message);
                    
                    if (success) {
                        messages[i].sent = true;
                        hasUpdates = true;
                        console.log(`✅ Message sent successfully to ${message.recipient}`);
                    } else {
                        console.log(`❌ Failed to send message to ${message.recipient}`);
                    }
                }
            }

            // Save updates if any messages were marked as sent
            if (hasUpdates) {
                await this.saveScheduledMessages(messages);
            }

        } catch (error) {
            console.error('❌ Error checking scheduled messages:', error);
        }
    }

    /**
     * Load scheduled messages from JSON file
     * @returns {Array} Array of scheduled messages
     */
    async loadScheduledMessages() {
        try {
            const data = await fs.readFile(this.scheduleFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Error loading scheduled messages:', error);
            return [];
        }
    }

    /**
     * Save scheduled messages to JSON file
     * @param {Array} messages - Array of scheduled messages
     */
    async saveScheduledMessages(messages) {
        try {
            await fs.writeFile(this.scheduleFile, JSON.stringify(messages, null, 2));
        } catch (error) {
            console.error('❌ Error saving scheduled messages:', error);
        }
    }

    /**
     * Check if a message should be sent based on current time
     * @param {Object} message - Message object
     * @param {Date} currentTime - Current time
     * @returns {boolean} True if message should be sent
     */
    shouldSendMessage(message, currentTime) {
        try {
            const scheduledTime = new Date(message.time);
            const timeDiff = Math.abs(currentTime.getTime() - scheduledTime.getTime());
            
            // Send if within 1 minute (60000 milliseconds) of scheduled time
            return timeDiff <= 60000 && currentTime >= scheduledTime;
        } catch (error) {
            console.error('❌ Error parsing message time:', error);
            return false;
        }
    }

    /**
     * Send a WhatsApp message
     * @param {Object} message - Message object containing type, recipient, and message
     * @returns {boolean} True if message was sent successfully
     */
    async sendMessage(message) {
        try {
            let chatId;

            if (message.type === 'individual') {
                // Format phone number for individual messages
                chatId = await this.formatPhoneNumber(message.recipient);
            } else if (message.type === 'group') {
                // Find group by name
                chatId = await this.findGroupByName(message.recipient);
            } else {
                console.error('❌ Invalid message type:', message.type);
                return false;
            }

            if (!chatId) {
                console.error('❌ Could not find chat for recipient:', message.recipient);
                return false;
            }

            // Send the message
            await this.client.sendMessage(chatId, message.message);
            return true;

        } catch (error) {
            console.error('❌ Error sending message:', error);
            return false;
        }
    }

    /**
     * Format phone number for WhatsApp
     * @param {string} phoneNumber - Phone number
     * @returns {string} Formatted chat ID
     */
    async formatPhoneNumber(phoneNumber) {
        try {
            // Remove all non-digit characters
            let cleanNumber = phoneNumber.replace(/\D/g, '');
            
            // Add country code if not present (assuming international format)
            if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
                cleanNumber = '91' + cleanNumber; // Add India country code, modify as needed
            }
            
            return cleanNumber + '@c.us';
        } catch (error) {
            console.error('❌ Error formatting phone number:', error);
            return null;
        }
    }

    /**
     * Find a group by name
     * @param {string} groupName - Name of the group
     * @returns {string|null} Group chat ID or null if not found
     */
    async findGroupByName(groupName) {
        try {
            const chats = await this.client.getChats();
            const group = chats.find(chat => 
                chat.isGroup && 
                chat.name.toLowerCase() === groupName.toLowerCase()
            );
            
            return group ? group.id._serialized : null;
        } catch (error) {
            console.error('❌ Error finding group:', error);
            return null;
        }
    }

    /**
     * Add a new scheduled message (utility method for future use)
     * @param {Object} messageData - Message data
     */
    async addScheduledMessage(messageData) {
        try {
            const messages = await this.loadScheduledMessages();
            messages.push({
                ...messageData,
                sent: false
            });
            await this.saveScheduledMessages(messages);
            console.log('✅ Scheduled message added successfully');
        } catch (error) {
            console.error('❌ Error adding scheduled message:', error);
        }
    }
}

// Main execution
async function main() {
    const scheduler = new WhatsAppScheduler();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await scheduler.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await scheduler.stop();
        process.exit(0);
    });

    // Start the scheduler
    await scheduler.start();
}

// Export for potential module use
module.exports = WhatsAppScheduler;

// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
