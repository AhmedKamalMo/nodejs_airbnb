const Message = require('../models/Message');
const Pusher = require('pusher');
const asyncHandler = require('express-async-handler');

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
        booking: bookingId
    });

    const populatedMessage = await Message.findById(message._id)
        .populate('sender')
        .populate('receiver');

    // Trigger Pusher event with error handling
    try {
        if (pusher) {
            await pusher.trigger(`chat-${receiverId}`, 'new-message', {
                message: populatedMessage
            });
        }
    } catch (error) {
        console.error('Pusher trigger error:', error);
        // Continue execution even if Pusher fails
    }

    res.status(201).json({
        status: 'success',
        data: populatedMessage
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
        { read: true }
    );

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
                $or: [{ sender: userId }, { receiver: userId }]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ['$sender', userId] },
                        '$receiver',
                        '$sender'
                    ]
                },
                lastMessage: { $first: '$$ROOT' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { 
                                $and: [
                                    { $eq: ['$receiver', userId] },
                                    { $eq: ['$read', false] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    await Message.populate(conversations, {
        path: 'lastMessage.sender lastMessage.receiver',
    });

    res.status(200).json({
        status: 'success',
        data: conversations
    });
});
