const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs').promises;
const path = require('path');

class WhatsAppScheduler {
    constructor(options = {}) {
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
        
        // Configuration options
        this.defaultCountryCode = options.defaultCountryCode || null; // No default country code
        this.requireCountryCode = options.requireCountryCode !== false; // Default to true
        
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

                // Validate message data
                if (!this.validateMessageData(message)) {
                    console.error('❌ Invalid message data:', message);
                    continue;
                }

                // Check if it's time to send this message
                if (this.shouldSendMessage(message, currentTime)) {
                    console.log(`📤 Sending scheduled message to ${message.recipient}...`);
                    
                    const success = await this.sendMessage(message);
                    
                    if (success) {
                        messages[i].sent = true;
                        messages[i].sentAt = new Date().toISOString();
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
     * Validate message data structure
     * @param {Object} message - Message object
     * @returns {boolean} True if valid
     */
    validateMessageData(message) {
        const required = ['type', 'recipient', 'message', 'time'];
        const hasRequired = required.every(field => message.hasOwnProperty(field));
        
        if (!hasRequired) {
            console.error('❌ Message missing required fields:', required);
            return false;
        }

        if (!['individual', 'group'].includes(message.type)) {
            console.error('❌ Invalid message type. Must be "individual" or "group"');
            return false;
        }

        return true;
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
     * Format phone number for WhatsApp (International support)
     * @param {string} phoneNumber - Phone number
     * @returns {string} Formatted chat ID
     */
    async formatPhoneNumber(phoneNumber) {
        try {
            // Remove all non-digit characters
            let cleanNumber = phoneNumber.replace(/\D/g, '');
            
            // Handle different number formats
            if (cleanNumber.length === 0) {
                console.error('❌ Invalid phone number: empty after cleaning');
                return null;
            }

            // If number already looks like it has country code (11+ digits), use as is
            if (cleanNumber.length >= 11) {
                return cleanNumber + '@c.us';
            }

            // If number is 10 digits and we have a default country code, add it
            if (cleanNumber.length === 10 && this.defaultCountryCode) {
                cleanNumber = this.defaultCountryCode + cleanNumber;
                return cleanNumber + '@c.us';
            }

            // For numbers that don't fit standard patterns
            if (cleanNumber.length < 10) {
                console.error('❌ Phone number too short:', cleanNumber);
                return null;
            }

            // If we require country code but don't have one, show error
            if (this.requireCountryCode && cleanNumber.length === 10) {
                console.error('❌ Country code required but not provided for:', cleanNumber);
                console.log('💡 Tip: Include country code (e.g., 1234567890 for US should be 11234567890)');
                return null;
            }

            // Use the number as is if we're not requiring country codes
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
     * Add a new scheduled message
     * @param {Object} messageData - Message data
     */
    async addScheduledMessage(messageData) {
        try {
            if (!this.validateMessageData(messageData)) {
                throw new Error('Invalid message data');
            }

            const messages = await this.loadScheduledMessages();
            messages.push({
                ...messageData,
                sent: false,
                createdAt: new Date().toISOString()
            });
            await this.saveScheduledMessages(messages);
            console.log('✅ Scheduled message added successfully');
        } catch (error) {
            console.error('❌ Error adding scheduled message:', error);
        }
    }

    /**
     * Get statistics about scheduled messages
     */
    async getStats() {
        try {
            const messages = await this.loadScheduledMessages();
            const stats = {
                total: messages.length,
                sent: messages.filter(msg => msg.sent).length,
                pending: messages.filter(msg => !msg.sent).length,
                individual: messages.filter(msg => msg.type === 'individual').length,
                group: messages.filter(msg => msg.type === 'group').length
            };
            
            console.log('📊 Scheduler Statistics:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return null;
        }
    }
}

// Main execution
async function main() {
    // Configuration options
    const options = {
        // defaultCountryCode: '1',        // US country code (optional)
        // requireCountryCode: true,       // Require country code for 10-digit numbers
    };

    const scheduler = new WhatsAppScheduler(options);
    
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
