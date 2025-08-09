// src/routes/contact.js

const express = require('express');
const router = express.Router();

const { contactFormLimiter } = require('../services/rateLimiter/contactFormLimiter');
const sendContactEmail = require('../controllers/contacts/sendcontactemail');


/*router.post('/', contactFormLimiter, sendContactEmail);*/

module.exports = router;