const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getTodayOrders,
  getUpcomingOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  regeneratePaymentLink,
} = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/today', getTodayOrders);
router.get('/upcoming', getUpcomingOrders);
router.get('/:id', getOrderById);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.post('/:id/payment-link', regeneratePaymentLink);

module.exports = router;
