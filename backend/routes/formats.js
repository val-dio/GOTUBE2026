const router = require('express').Router();
const { formats } = require('../controllers/formatsController');

router.get('/', formats);

module.exports = router;
