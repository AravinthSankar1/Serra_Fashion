import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as supportController from './support.controller';

const router = express.Router();

// Both customers and admins need these
router.use(authenticate);

router.post('/start', supportController.startConversation);
router.post('/send/:conversationId', supportController.sendMessage);
router.get('/conversations', supportController.getConversations);
router.get('/messages/:conversationId', supportController.getMessages);

export default router;
