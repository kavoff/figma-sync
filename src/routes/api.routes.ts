import { Router } from 'express';
import { TextController } from '../controllers/text.controller';

const router = Router();
const textController = new TextController();

// Text management routes
router.get('/texts', textController.getTexts.bind(textController));
router.get('/texts/:key', textController.getText.bind(textController));
router.put('/texts/:key', textController.updateText.bind(textController));
router.delete('/texts/:key', textController.deleteText.bind(textController));

export default router;
