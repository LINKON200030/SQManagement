const express = require('express');
const router = express.Router();
const { list, create, update, remove } = require('../controllers/announcementController');

router.get('/', list);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
