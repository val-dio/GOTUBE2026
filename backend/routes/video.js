const router = require('express').Router();
const { getVideo } = require('../controllers/videoController');

router.get('/', getVideo);

module.exports = router;
