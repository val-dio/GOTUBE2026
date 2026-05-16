const router = require('express').Router();
const { download } = require('../controllers/downloadController');

router.post('/', download);

module.exports = router;
