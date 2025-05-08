const Message = require('../models/Message');
const Booking = require('../models/Booking');
const User = require('../models/users');
const Pusher = require('pusher');
const mongoose = require('mongoose');

// Initialize Pusher only if credentials are available
let pusher = null;
if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER) {
    pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true
    });
}

const messageController = {
    // Send a new message
    sendMessage: async (req, res) => {
        try {
            const { receiverId, bookingId, content, type = 'text' } = req.body;
            const senderId = req.user._id;
            console.log('senderId:', senderId);
            console.log('receiverId:', receiverId);
            console.log('bookingId:', bookingId);
            console.log('content:', content);
            console.log('type:', type);

            // Verify booking exists and user is part of it
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Booking not found'
                });
            }

            // Get all hostIds from the properties array
            const hostIds = booking.properties.map(prop => prop.hostId.toString());

            // Check if the sender is either the booking user or one of the hosts
            const isSenderAuthorized = booking.userId.toString() === senderId.toString() || hostIds.includes(senderId.toString());

            // Check if the receiver is either the booking user or one of the hosts
            const isReceiverAuthorized = booking.userId.toString() === receiverId || hostIds.includes(receiverId);

            if (!isSenderAuthorized || !isReceiverAuthorized) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You are not authorized to send messages for this booking'
                });
            }

            const message = new Message({
                sender: senderId,
                receiver: receiverId,
                booking: bookingId,
                content,
                type
            });

            await message.save();

            // Populate sender and receiver details
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'name email profileImage')
                .populate('receiver', 'name email profileImage');

            // Only trigger Pusher events if Pusher is initialized
            if (pusher) {
                const roomId = [senderId.toString(), receiverId.toString()].sort().join("_");
                pusher.trigger(`private-chat-${roomId}`, 'new-message', {
                    message: populatedMessage
                });

                // Also trigger a notification event
                pusher.trigger(`private-notifications-${receiverId}`, 'new-notification', {
                    type: 'new_message',
                    message: 'You have a new message',
                    data: populatedMessage
                });
            }

            res.status(201).json({
                status: 'success',
                data: populatedMessage
            });
        } catch (error) {
            console.error('Error in sendMessage:', error);
            res.status(400).json({
                status: 'fail',
                message: error.message
            });
        }
    },

    // Get conversation history for a specific booking
    getBookingMessages: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const userId = req.user._id;
            const { page = 1, limit = 50 } = req.query;

            // Verify booking exists and user is part of it
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Booking not found'
                });
            }

            // Get all hostIds from the properties array
            const hostIds = booking.properties.map(prop => prop.hostId.toString());

            // Check if the user is either the booking user or one of the hosts
            const isUserAuthorized = booking.userId.toString() === userId.toString() || hostIds.includes(userId.toString());

            if (!isUserAuthorized) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You are not authorized to view these messages'
                });
            }

            const messages = await Message.find({ booking: bookingId })
                .populate('sender', 'name email profileImage')
                .populate('receiver', 'name email profileImage')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            const total = await Message.countDocuments({ booking: bookingId });

            res.status(200).json({
                status: 'success',
                data: {
                    messages,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error in getBookingMessages:', error);
            res.status(400).json({
                status: 'fail',
                message: error.message
            });
        }
    },

    // Mark messages as read
    markMessagesAsRead: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const userId = req.user._id;

            const result = await Message.updateMany(
                {
                    booking: bookingId,
                    receiver: userId,
                    isRead: false
                },
                { isRead: true }
            );

            res.status(200).json({
                status: 'success',
                data: {
                    modifiedCount: result.modifiedCount
                }
            });
        } catch (error) {
            console.error('Error in markMessagesAsRead:', error);
            res.status(400).json({
                status: 'fail',
                message: error.message
            });
        }
    },

    // Get unread messages count
    getUnreadCount: async (req, res) => {
        try {
            const userId = req.user._id;

            const count = await Message.countDocuments({
                receiver: userId,
                isRead: false
            });

            res.status(200).json({
                status: 'success',
                data: { count }
            });
        } catch (error) {
            console.error('Error in getUnreadCount:', error);
            res.status(400).json({
                status: 'fail',
                message: error.message
            });
        }
    },

    // Get recent conversations
    getRecentConversations: async (req, res) => {
        try {
            const userId = req.user._id;
            const { page = 1, limit = 10 } = req.query;

            // Get the latest message from each conversation
            const conversations = await Message.aggregate([
                {
                    $match: {
                        $or: [
                            { sender: new mongoose.Types.ObjectId(userId) },
                            { receiver: new mongoose.Types.ObjectId(userId) }
                        ]
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $group: {
                        _id: '$booking',
                        lastMessage: { $first: '$$ROOT' },
                        unreadCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                                            { $eq: ['$isRead', false] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $skip: (page - 1) * limit
                },
                {
                    $limit: parseInt(limit)
                }
            ]);

            // Populate necessary fields
            await Message.populate(conversations, [
                { path: 'lastMessage.sender', select: 'name email profileImage' },
                { path: 'lastMessage.receiver', select: 'name email profileImage' },
                { path: 'lastMessage.booking', select: 'properties.propertyId properties.startDate properties.endDate' }
            ]);

            const total = await Message.aggregate([
                {
                    $match: {
                        $or: [
                            { sender: new mongoose.Types.ObjectId(userId) },
                            { receiver: new mongoose.Types.ObjectId(userId) }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$booking'
                    }
                },
                {
                    $count: 'total'
                }
            ]);

            res.status(200).json({
                status: 'success',
                data: {
                    conversations,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: total[0]?.total || 0,
                        pages: Math.ceil((total[0]?.total || 0) / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error in getRecentConversations:', error);
            res.status(400).json({
                status: 'fail',
                message: error.message
            });
        }
    }
};

module.exports = messageController;
