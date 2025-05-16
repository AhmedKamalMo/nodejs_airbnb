const express = require('express');
const { 
    sendMessage, 
    getConversation, 
    getAllConversations 
} = require('../controller/chatController');
const { isAuthenticated } = require('../middlewares/userauth');

const router = express.Router();


// Routes
router.post('/send', isAuthenticated,sendMessage);
router.get('/conversations/:userId', isAuthenticated,getConversation);
router.get('/conversations', isAuthenticated,getAllConversations);

module.exports = router;
