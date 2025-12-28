import  express from 'express';
import { signin, signup } from '../controllers/auth.controllers.js';

const router = express.Router();

router.post('/sign-up', signup);
router.post('/sign-in', signin);
router.get('/hello', (req, res) => {
    res.send("hello world")
})

export default router;