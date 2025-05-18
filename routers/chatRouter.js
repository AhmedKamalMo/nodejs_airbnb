const express = require('express');
const {
    sendMessage,
    getConversation,
    getAllConversations,
    // Message Management
    deleteMessage,
    editMessage,
    markAsDelivered,
    markAsRead,
    getUnreadCount,
    // Advanced Features
    sendAttachment,
    addReaction,
    setTypingStatus,
    searchMessages,
    // Group Chat
    createGroup,
    addToGroup,
    removeFromGroup,
    // User Status
    updateUserStatus,
    getOnlineUsers,
    pusherAuth,
    chatbot
} = require('../controller/chatController');
const { isAuthenticated } = require('../middlewares/userauth');

const router = express.Router();

// Basic Message Routes
router.post('/messages', isAuthenticated, sendMessage);
router.get('/conversations/:userId', isAuthenticated, getConversation);
router.get('/conversations', isAuthenticated, getAllConversations);
// Message Management
router.delete('/messages/:messageId', isAuthenticated, deleteMessage);
router.patch('/messages/:messageId', isAuthenticated, editMessage);
router.patch('/messages/:messageId/deliver', isAuthenticated, markAsDelivered);
router.patch('/messages/:messageId/read', isAuthenticated, markAsRead);
router.get('/messages/unread/count', isAuthenticated, getUnreadCount);
// 
router.post("/chatbot",chatbot);
// 
// Advanced Features
router.post('/messages/attachment', isAuthenticated, sendAttachment);
router.post('/pusher/auth', isAuthenticated, pusherAuth);
router.post('/messages/:messageId/reactions', isAuthenticated, addReaction);
router.post('/conversations/:userId/typing', isAuthenticated, setTypingStatus);
router.get('/messages/search', isAuthenticated, searchMessages);

// Group Chat Management
router.post('/groups', isAuthenticated, createGroup);
router.post('/groups/:groupId/members', isAuthenticated, addToGroup);
router.delete('/groups/:groupId/members/:userId', isAuthenticated, removeFromGroup);

// User Status Management
router.patch('/users/status', isAuthenticated, updateUserStatus);
router.get('/users/online', isAuthenticated, getOnlineUsers);

module.exports = router;
