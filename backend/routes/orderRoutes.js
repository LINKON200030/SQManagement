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
} = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/today', getTodayOrders);
router.get('/upcoming', getUpcomingOrders);
router.get('/:id', getOrderById);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
