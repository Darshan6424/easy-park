import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { bookSpot, deleteBooking, editBooking, getBooking } from '../controllers/book.controllers.js';

const router = express.Router();

router.post('/new',protectRoute, bookSpot);
router.get('/delete', protectRoute, deleteBooking);
router.post('/edit', protectRoute, editBooking);
router.get('/', protectRoute, getBooking);
router.get("/:id", protectRoute, getOneBooking);

export default router;