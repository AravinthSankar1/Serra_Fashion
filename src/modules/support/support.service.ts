import { Conversation, Message } from './support.model';
import { User } from '../user/user.model';

export const startConversation = async (userId: string, text: string, subject?: string) => {
    // Check if there is already an OPEN conversation for this user
    let conversation = await Conversation.findOne({
        participants: userId,
        status: 'OPEN'
    });

    if (!conversation) {
        // Find an admin to be the other participant
        const admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
        if (!admin) {
            throw new Error('No support agents available at the moment.');
        }

        conversation = await Conversation.create({
            participants: [userId, admin._id],
            subject: subject || 'General Inquiry',
            status: 'OPEN'
        });
    }

    const message = await Message.create({
        conversation: conversation._id,
        sender: userId,
        text
    });

    await message.populate('sender', 'name profilePicture role');

    conversation.lastMessage = message._id as any;
    await conversation.save();

    return { conversation, message };
};

export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        text
    });

    await message.populate('sender', 'name profilePicture role');

    conversation.lastMessage = message._id as any;
    await conversation.save();

    return message;
};

export const getConversations = async (userId: string, role: string) => {
    let query = {};
    if (role === 'customer') {
        query = { participants: userId };
    }
    // Admins see all conversations or those they are part of. 
    // For now, let's allow admins to see ALL support conversations.
    
    return Conversation.find(query)
        .populate('participants', 'name email profilePicture')
        .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'name' }
        })
        .sort({ updatedAt: -1 });
};

export const getMessages = async (conversationId: string) => {
    // Mark as read when fetching? Maybe better in a separate endpoint but let's do it here for simplicity
    // Actually, marking as read should probably be specific to the recipient.
    
    return Message.find({ conversation: conversationId })
        .populate('sender', 'name profilePicture role')
        .sort({ createdAt: 1 });
};

export const markAsRead = async (conversationId: string, userId: string) => {
    return Message.updateMany(
        { conversation: conversationId, sender: { $ne: userId }, isRead: false },
        { $set: { isRead: true } }
    );
};
