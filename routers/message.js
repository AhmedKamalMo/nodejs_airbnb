const express = require('express');
const router = express.Router();
const messageController = require('../controller/messageController');
const { isAuthenticated } = require('../middlewares/userauth');

/**
 * @swagger
 * /messages/send:
 *   post:
 *     tags: [Messages]
 *     summary: Send a new message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - bookingId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *               bookingId:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image]
 *                 default: text
 */
router.post('/send', isAuthenticated, messageController.sendMessage);

/**
 * @swagger
 * /messages/booking/{bookingId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get messages for a specific booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 */
router.get('/booking/:bookingId', isAuthenticated, messageController.getBookingMessages);

/**
 * @swagger
 * /messages/read/{bookingId}:
 *   patch:
 *     tags: [Messages]
 *     summary: Mark messages as read for a specific booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/read/:bookingId', isAuthenticated, messageController.markMessagesAsRead);

/**
 * @swagger
 * /messages/unread/count:
 *   get:
 *     tags: [Messages]
 *     summary: Get count of unread messages
 *     security:
 *       - bearerAuth: []
 */
router.get('/unread/count', isAuthenticated, messageController.getUnreadCount);

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: Get recent conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 */
router.get('/conversations', isAuthenticated, messageController.getRecentConversations);

module.exports = router;
