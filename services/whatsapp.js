const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Helper function to format phone number
function formatPhoneNumber(phone) {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove leading '+' if present
    if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
        // For Egyptian numbers starting with 0, remove 0 and add country code
        cleaned = '20' + cleaned.substring(1);
    }
    
    return cleaned;
}

class WhatsAppService {
    constructor() {
        this.client = new Client({
            puppeteer: {
                args: ['--no-sandbox']
            }
        });

        this.isReady = false;

        // Generate QR code for authentication
        this.client.on('qr', (qr) => {
            console.log('Scan this QR code in WhatsApp to log in:');
            qrcode.generate(qr, { small: true });
        });

        // When client is ready
        this.client.on('ready', () => {
            console.log('WhatsApp client is ready!');
            this.isReady = true;
        });

        // Initialize the client
        this.client.initialize();
    }

    // Function to send OTP
    async sendOTP(to, otp) {
        try {
            if (!this.isReady) {
                throw new Error('WhatsApp client not ready. Please scan QR code first.');
            }

            // Format the message
            const message = `Your AirBnB login OTP is: ${otp}. This code will expire in 5 minutes.`;

            // Format the phone number
            const formattedNumber = formatPhoneNumber(to);
            
            console.log('Sending WhatsApp message to:', formattedNumber);
            
            // Send message
            await this.client.sendMessage(`${formattedNumber}@c.us`, message);
            return true;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            return false;
        }
    }
}

// Create a singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
