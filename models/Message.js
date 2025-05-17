const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: function() {
            return !this.isAttachment;
        }
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    // Message status
    delivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    // Message editing
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    // Attachments
    isAttachment: {
        type: Boolean,
        default: false
    },
    attachmentType: {
        type: String,
        enum: ['image', 'video', 'document', 'audio'],
        required: function() {
            return this.isAttachment;
        }
    },
    attachmentUrl: {
        type: String,
        required: function() {
            return this.isAttachment;
        }
    },
    // Reactions
    reactions: {
        type: Map,
        of: String,
        default: new Map()
    },
    // For group messages (future implementation)
    isGroupMessage: {
        type: Boolean,
        default: false
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, read: 1 });
messageSchema.index({ content: 'text' });

// Add a pre-find middleware to always populate sender and receiver
messageSchema.pre('find', function() {
    this.populate({
        path: 'sender',
        select: 'name email avatar'
    }).populate({
        path: 'receiver',
        select: 'name email avatar'
    });
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
