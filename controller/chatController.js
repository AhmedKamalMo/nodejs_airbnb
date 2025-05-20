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

exports.pusherAuth = (req, res) => {
    if (!pusher) {
        return res.status(500).json({ message: 'Pusher not initialized' });
    }

    const socketId = req.body.socket_id;
    const channelName = req.body.channel_name;
    console.log('socketId:', socketId);
    console.log('channelName:', channelName);

    // ✅ التحقق من أن socket_id موجود
    if (!socketId || typeof socketId !== 'string') {

        return res.status(400).json({ error: 'Missing or invalid socket_id' });
    }

    // ✅ التحقق من أن channel name موجود
    if (!channelName || typeof channelName !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid channel_name' });
    }

    try {
        const auth = pusher.authenticate(socketId, channelName);
        res.send(auth);
    } catch (error) {
        console.error('Error authenticating Pusher:', error);
        res.status(500).json({ error: 'Failed to authenticate with Pusher' });
    }
};
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
        .populate({ path: 'sender', select: 'name email avatar _id' })
        .populate({ path: 'receiver', select: 'name email avatar _id' });

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
        .populate({ path: 'sender', select: 'name email avatar _id' })
        .populate({ path: 'receiver', select: 'name email avatar _id' })
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
                            {
                                $and: [
                                    { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
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

    // Populate user details with proper model references
    const populatedConversations = await Message.populate(conversations, [
        {
            path: 'lastMessage.sender',
            model: 'User',
            select: 'name email avatar _id'
        },
        {
            path: 'lastMessage.receiver',
            model: 'User',
            select: 'name email avatar _id'
        },
        {
            path: '_id',
            model: 'User',
            select: 'name email avatar _id'
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

function parseAccommodationRequest(message) {
    // Step 1: Detect Location (e.g., "in Miami")
    const locationMatch = message.match(/in\s+([a-zA-Z\s]+)/i);
    const location = locationMatch ? locationMatch[1]?.trim() : null;

    // Step 2: Keywords indicating an accommodation request
    const accommodationKeywords = [
        "apartment", "flat", "villa", "house", "room", "studio", "accommodation", "rent"
    ];
    const isAccommodationRequest = accommodationKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
    );

    // Step 3: Extract price range (e.g., "under $600" or "from 200 to 400")
    let minPrice, maxPrice;
    const priceMatch = message.match(/(\d+)\s*to\s*(\d+)|(\d+)\s*per night|under\s+(\d+)|below\s+(\d+)|less than\s+(\d+)/i);

    if (priceMatch) {
        if (priceMatch[1] && priceMatch[2]) {
            minPrice = Number(priceMatch[1]);
            maxPrice = Number(priceMatch[2]);
        } else if (priceMatch[3]) {
            maxPrice = Number(priceMatch[3]);
        } else if (priceMatch[4] || priceMatch[5] || priceMatch[6]) {
            maxPrice = Number(priceMatch[4] || priceMatch[5] || priceMatch[6]);
        }
    }

    // Step 4: Extract number of people (e.g., "for 4 adults")
    const adultsMatch = message.match(/for\s*(\d+)\s*(?:people|person|adults|guest)/i);
    const adults = adultsMatch ? Number(adultsMatch[1]) : undefined;

    // Step 5: Amenities mapping (keyword => ID)
    const amenitiesMap = {
        'pool': '68025bdcc1fca36d3274431c',   // Swimming Pool
        'wifi': '68025bf0c1fca36d3274431e',     // Free Wi-Fi
        'gym': '68025c02c1fca36d32744320',     // Gym
        'parking': '68025c19c1fca36d32744324',   // Parking
        "Coffee ": '68025c0ec1fca36d32744322',
        'spa': '68025c3fc1fca36d32744326',     // Spa
        'restaurant': '68025c57c1fca36d32744328', // Restaurant
    };

    const amenities = [];
    Object.keys(amenitiesMap).forEach(keyword => {
        if (message.toLowerCase().includes(keyword)) {
            amenities.push(amenitiesMap[keyword]);
        }
    });

    // Step 6: Pet-friendly detection
    const petsMatch = message.toLowerCase().includes("pet") ||
        message.toLowerCase().includes("dog") ||
        message.toLowerCase().includes("cat");
    const pets = petsMatch ? "allowed" : undefined;

    // Final result
    return {
        isAccommodationRequest,
        location,
        minPrice,
        maxPrice,
        adults,
        amenities,
        pets
    };
}
async function getAIResponse(chatHistory) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: chatHistory,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("OpenRouter Error:", error.message);
        return error.message;
    }
}
const chatMemory = [
    { role: "system", content: "You are a helpful AI assistant." }
];
exports.chatbot = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        // Step 1: Parse the message to check for accommodation request
        const parsed = parseAccommodationRequest(message);

        // Step 2: Check if it's an accommodation request based on keywords and location
        if (parsed.isAccommodationRequest && parsed.location) {
            try {
                // 🔍 It's an accommodation request — proceed with search
                const url = new URL("http://localhost:3000/Hotel/flitter");
                if (parsed.location) url.searchParams.append("city", parsed.location);
                if (parsed.minPrice) url.searchParams.append("minPrice", parsed.minPrice);
                if (parsed.maxPrice) url.searchParams.append("maxPrice", parsed.maxPrice);
                if (parsed.adults) url.searchParams.append("adults", parsed.adults);
                if (parsed.amenities?.length > 0) url.searchParams.append("amenities", parsed.amenities.join(","));
                if (parsed.pets !== undefined) url.searchParams.append("pets", parsed.pets);
                url.searchParams.append("limit", 5);

                console.log("URL: ", url);

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const apiResponse = await response.json();

                if (apiResponse.message === "No hotels found matching the criteria") {
                    return res.json({
                        response: `I couldn't find any places in ${parsed.location}. Try another location or adjust your filters.`
                    });
                }

                const results = apiResponse.data || [];

                let reply = `I found ${results.length} places in ${parsed.location}:\n\n`;

                results.forEach((hotel, index) => {
                    const name = hotel.title || 'Unknown';
                    const price = hotel.pricePerNight || 'Not specified';
                    const rating = hotel.rating || 'No rating';
                    const bedrooms = hotel.spaceDetails?.bedrooms || 0;
                    const beds = hotel.spaceDetails?.beds || 0;
                    const adults = hotel.capacity?.adults || 0;

                    reply += `${index + 1}. ${name}<br/>`;
                    reply += `   💵 Price per night: $${price}<br/>`;
                    reply += `   ⭐ Rating: ${rating}<br/>`;
                    reply += `   👪 Capacity: Up to ${adults} adults<br/>`;
                    reply += `   🛏️ Bedrooms: ${bedrooms} | Beds: ${beds}<br/>`;

                    if (hotel.amenities && hotel.amenities.length > 0) {
                        const amenitiesList = hotel.amenities.map(a => a.name).join(", ");
                        reply += `   ✅ Amenities: ${amenitiesList}<br/>`;
                    }

                    if (hotel.houseRules && hotel.houseRules.length > 0) {
                        const houseRulesList = hotel.houseRules.join(", ");
                        reply += `   🚷 House Rules: ${houseRulesList}<br/>`;
                    }

                    const propertyLink = `http://localhost:5173/details/${hotel._id}`;
                    reply += `🔗 View Property: <a href="${propertyLink}" target="_blank">Click here</a><br/><br/>`;
                });

                reply += "Would you like more details about any of these places?";

                return res.json({ response: reply });

            } catch (err) {
                console.error("Filter API Error:", err.response?.data || err.message);
                return res.json({ response: `I couldn't find any places in ${parsed.location}. Try another location or adjust your filters.` });
            }
        }

        // Step 3: If NOT an accommodation request → pass to AI chatbot
        chatMemory.push({ role: "user", content: message });

        const aiResponse = await getAIResponse(chatMemory);

        chatMemory.push({ role: "assistant", content: aiResponse });

        if (chatMemory.length > 10) {
            chatMemory.splice(0, chatMemory.length - 10); // Keep memory size limited
        }

        res.json({ response: aiResponse });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Failed to process request" });
    }
};