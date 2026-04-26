const express = require('express');
const router = express.Router();
const { list, getOne, create, update, remove } = require('../controllers/knowledgeController');

router.get('/', list);
router.post('/', create);
router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
