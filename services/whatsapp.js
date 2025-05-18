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

class WhatsAppService {
    constructor() {
        this.qrCodeData = null;
        this.isReady = false;
        this.isProduction = process.env.NODE_ENV === 'production';
        
        if (!this.isProduction) {
            this.initializeClient();
        }
    }

    async initializeClient() {
        try {
            const { Client, LocalAuth } = require('whatsapp-web.js');
            
            this.client = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: {
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

            this.initializationPromise = new Promise((resolve, reject) => {
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
                    resolve();
                });

                this.client.on('auth_failure', (msg) => {
                    console.error('❌ Authentication failed:', msg);
                    reject(new Error(`WhatsApp authentication failed: ${msg}`));
                });

                this.client.initialize().catch(reject);
            });
        } catch (error) {
            console.error('Failed to initialize WhatsApp client:', error);
            this.isReady = false;
        }
    }

    async waitForReady(timeoutMs = 60000) {
        if (this.isProduction) return false;
        if (this.isReady) return true;
        
        try {
            await Promise.race([
                this.initializationPromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('WhatsApp initialization timeout')), timeoutMs)
                )
            ]);
            return true;
        } catch (error) {
            console.error('Error waiting for WhatsApp client:', error);
            return false;
        }
    }

    async sendOTP(to, otp) {
        try {
            if (this.isProduction) {
                console.log('WhatsApp service is disabled in production. OTP:', otp);
                // In production, you might want to use a different service like Twilio or SMS
                return true;
            }

            const ready = await this.waitForReady();
            if (!ready) {
                throw new Error('WhatsApp client is not ready. Please ensure you have scanned the QR code.');
            }

            const message = `Your AirBnB login OTP is: ${otp}. This code will expire in 5 minutes.`;
            const formattedNumber = formatPhoneNumber(to);
            await this.client.sendMessage(`${formattedNumber}@c.us`, message);
            return true;
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            return false;
        }
    }

    getQRCode() {
        if (this.isProduction) return null;
        return this.qrCodeData;
    }
}

// Create a singleton instance
const whatsappService = new WhatsAppService();

module.exports = { whatsappService };
