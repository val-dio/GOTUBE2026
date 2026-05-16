const router = require('express').Router();
const { videoInfo } = require('../controllers/videoInfoController');

router.get('/', videoInfo);

module.exports = router;
