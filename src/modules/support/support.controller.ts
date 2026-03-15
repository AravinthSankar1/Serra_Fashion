import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as supportService from './support.service';

export const startConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { text, subject } = req.body;
    const result = await supportService.startConversation(req.user.sub, text, subject);
    res.status(201).send({
        status: 'success',
        data: result
    });
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { conversationId } = req.params;
    const { text } = req.body;
    const message = await supportService.sendMessage(conversationId, req.user.sub, text);
    res.status(201).send({
        status: 'success',
        data: message
    });
});

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversations = await supportService.getConversations(req.user.sub, req.user.role);
    res.send({
        status: 'success',
        data: conversations
    });
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { conversationId } = req.params;
    const messages = await supportService.getMessages(conversationId);
    // Mark as read when messages are fetched
    await supportService.markAsRead(conversationId, req.user.sub);
    res.send({
        status: 'success',
        data: messages
    });
});
