const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.loginLocal);
router.post('/oauth', authController.loginOAuth);
router.post('/refresh', authController.refreshToken);
router.post('/register', authController.registerUsuario);

module.exports = router;