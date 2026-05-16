const router = require('express').Router();
const { contact } = require('../controllers/contactController');

// Stricter rate limit for contact form — 5 submissions per 15 min per IP
const rateLimit = require('express-rate-limit');
const contactLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please wait before trying again.' },
});

router.post('/', contactLimit, contact);

module.exports = router;
