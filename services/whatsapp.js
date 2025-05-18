const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');

function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('00')) {
        cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
        cleaned = '20' + cleaned.substring(1);
    }
    return cleaned;
}

// إنشاء app و server
const app = express();
const server = require('http').createServer(app);

class WhatsAppService {
    constructor() {
        this.qrCodeData = null;
        this.client = new Client({
            authStrategy: new LocalAuth(), // ✅ حفظ الجلسة هنا
            puppeteer: {
                // In Docker, use the installed Chromium. Otherwise, use the one that comes with Puppeteer
                ...(process.env.PUPPETEER_EXECUTABLE_PATH ? {
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
                } : {}),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
                headless: true
            }
        });

        this.isReady = false;

        this.client.on('qr', async (qr) => {
            console.log('Scan this QR code in WhatsApp to log in:');
            try {
                this.qrCodeData = await qrcode.toDataURL(qr);
                console.log('QR Code generated as Data URL.');
            } catch (err) {
                console.error('Error generating QR:', err);
            }
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp client is ready!');
            this.isReady = true;
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
        });

        this.client.initialize();
    }

    async sendOTP(to, otp) {
        try {
            if (!this.isReady) throw new Error('WhatsApp not ready.');

            const message = `Your AirBnB login OTP is: ${otp}. This code will expire in 5 minutes.`;
            const formattedNumber = formatPhoneNumber(to);
            await this.client.sendMessage(`${formattedNumber}@c.us`, message);
            return true;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            return false;
        }
    }
}

const whatsappService = new WhatsAppService();

module.exports = { whatsappService, app, server };
