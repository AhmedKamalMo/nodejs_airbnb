const Message = require('../models/Message');
const Pusher = require('pusher');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Initialize Pusher with error handling
let pusher;
try {
    pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID || '',
        key: process.env.PUSHER_KEY || '',
        secret: process.env.PUSHER_SECRET || '',
        cluster: process.env.PUSHER_CLUSTER || 'eu',
        useTLS: true
    });
} catch (error) {
    console.error('Pusher initialization error:', error);
}

// Helper function to trigger Pusher events
const triggerPusherEvent = async (channel, event, data) => {
    try {
        if (pusher) {
            await pusher.trigger(channel, event, data);
        }
    } catch (error) {
        console.error('Pusher trigger error:', error);
    }
};

// Send a new message
exports.sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, content, bookingId } = req.body;
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'User not authenticated'
        });
    }
    
    const senderId = req.user._id;

    const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        booking: bookingId,
        delivered: false,
        read: false
    });

    const populatedMessage = await Message.findById(message._id)
        .populate('sender')
        .populate('receiver');

    await triggerPusherEvent(`chat-${receiverId}`, 'new-message', { message: populatedMessage });

    res.status(201).json({
        status: 'success',
        data: populatedMessage
    });
});

// Delete a message
exports.deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const message = await Message.findOneAndDelete({
        _id: messageId,
        sender: req.user._id
    });

    if (!message) {
        return res.status(404).json({
            status: 'error',
            message: 'Message not found or unauthorized'
        });
    }

    await triggerPusherEvent(`chat-${message.receiver}`, 'message-deleted', { messageId });

    res.status(200).json({
        status: 'success',
        message: 'Message deleted successfully'
    });
});

// Edit a message
exports.editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findOneAndUpdate(
        { _id: messageId, sender: req.user._id },
        { 
            content,
            edited: true,
            editedAt: new Date()
        },
        { new: true }
    ).populate('sender').populate('receiver');

    if (!message) {
        return res.status(404).json({
            status: 'error',
            message: 'Message not found or unauthorized'
        });
    }

    await triggerPusherEvent(`chat-${message.receiver}`, 'message-edited', { message });

    res.status(200).json({
        status: 'success',
        data: message
    });
});

// Mark message as delivered
exports.markAsDelivered = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const message = await Message.findOneAndUpdate(
        { _id: messageId, receiver: req.user._id, delivered: false },
        { delivered: true, deliveredAt: new Date() },
        { new: true }
    );

    if (message) {
        await triggerPusherEvent(`chat-${message.sender}`, 'message-delivered', { messageId });
    }

    res.status(200).json({
        status: 'success',
        data: message
    });
});

// Mark message as read
exports.markAsRead = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const message = await Message.findOneAndUpdate(
        { _id: messageId, receiver: req.user._id, read: false },
        { read: true, readAt: new Date() },
        { new: true }
    );

    if (message) {
        await triggerPusherEvent(`chat-${message.sender}`, 'message-read', { messageId });
    }

    res.status(200).json({
        status: 'success',
        data: message
    });
});

// Get unread message count
exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Message.countDocuments({
        receiver: req.user._id,
        read: false
    });

    res.status(200).json({
        status: 'success',
        data: { count }
    });
});

// Send attachment
exports.sendAttachment = asyncHandler(async (req, res) => {
    const { receiverId, attachmentType, attachmentUrl } = req.body;
    
    const message = await Message.create({
        sender: req.user._id,
        receiver: receiverId,
        attachmentType,
        attachmentUrl,
        isAttachment: true
    });

    const populatedMessage = await Message.findById(message._id)
        .populate('sender')
        .populate('receiver');

    await triggerPusherEvent(`chat-${receiverId}`, 'new-message', { message: populatedMessage });

    res.status(201).json({
        status: 'success',
        data: populatedMessage
    });
});

// Add reaction to message
exports.addReaction = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { reaction } = req.body;

    const message = await Message.findByIdAndUpdate(
        messageId,
        { $set: { [`reactions.${req.user._id}`]: reaction } },
        { new: true }
    ).populate('sender').populate('receiver');

    if (!message) {
        return res.status(404).json({
            status: 'error',
            message: 'Message not found'
        });
    }

    await triggerPusherEvent(`chat-${message.sender}`, 'message-reaction', { 
        messageId,
        userId: req.user._id,
        reaction
    });

    res.status(200).json({
        status: 'success',
        data: message
    });
});

// Set typing status
exports.setTypingStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isTyping } = req.body;

    await triggerPusherEvent(`chat-${userId}`, 'typing-status', {
        userId: req.user._id,
        isTyping
    });

    res.status(200).json({
        status: 'success',
        message: 'Typing status updated'
    });
});

// Search messages
exports.searchMessages = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const userId = req.user._id;

    const messages = await Message.find({
        $and: [
            { $or: [{ sender: userId }, { receiver: userId }] },
            { content: { $regex: query, $options: 'i' } }
        ]
    })
    .sort({ createdAt: -1 })
    .populate('sender')
    .populate('receiver');

    res.status(200).json({
        status: 'success',
        data: messages
    });
});

// Get conversation between two users
exports.getConversation = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
        $or: [
            { sender: currentUserId, receiver: userId },
            { sender: userId, receiver: currentUserId }
        ]
    })
    .sort({ createdAt: 1 })
    .populate('sender')
    .populate('receiver')
    .populate('booking');

    // Mark messages as read
    await Message.updateMany(
        { sender: userId, receiver: currentUserId, read: false },
        { read: true, readAt: new Date() }
    );

    await triggerPusherEvent(`chat-${userId}`, 'messages-read', { 
        userId: currentUserId
    });

    res.status(200).json({
        status: 'success',
        data: messages
    });
});

// Get all conversations for a user
exports.getAllConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
        {
            $match: {
                $or: [{ sender: new mongoose.Types.ObjectId(userId) }, 
                      { receiver: new mongoose.Types.ObjectId(userId) }]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
                        '$receiver',
                        '$sender'
                    ]
                },
                lastMessage: { $first: '$$ROOT' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [
                                { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                                { $eq: ['$read', false] }
                            ]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    // Populate user details with proper model references
    const populatedConversations = await Message.populate(conversations, [
        { 
            path: 'lastMessage.sender',
            model: 'User',
            select: 'name email profilePicture'
        },
        { 
            path: 'lastMessage.receiver',
            model: 'User',
            select: 'name email profilePicture'
        },
        { 
            path: '_id',
            model: 'User',
            select: 'name email profilePicture'
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: populatedConversations
    });
});

// Create group chat
exports.createGroup = asyncHandler(async (req, res) => {
    const { name, members } = req.body;
    
    // Group chat implementation would go here
    // This would require a new Group model and additional logic
    
    res.status(501).json({
        status: 'error',
        message: 'Group chat functionality coming soon'
    });
});

// Add member to group
exports.addToGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    // Group member addition logic would go here
    
    res.status(501).json({
        status: 'error',
        message: 'Group chat functionality coming soon'
    });
});

// Remove member from group
exports.removeFromGroup = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;
    
    // Group member removal logic would go here
    
    res.status(501).json({
        status: 'error',
        message: 'Group chat functionality coming soon'
    });
});

// Update user status
exports.updateUserStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const userId = req.user._id;

    // This would typically update a user's online status in the User model
    await triggerPusherEvent('user-presence', 'status-change', {
        userId,
        status
    });

    res.status(200).json({
        status: 'success',
        message: 'Status updated successfully'
    });
});

// Get online users
exports.getOnlineUsers = asyncHandler(async (req, res) => {
    // This would typically query the User model for online users
    // For now, we'll return a placeholder response
    res.status(200).json({
        status: 'success',
        data: {
            onlineUsers: []
        }
    });
});


