var express = require('express')
const AuthController = require('../../controllers/AuthController')
const { authenticate } = require('../../middlewares/jwt')
var router = express.Router()
var auth = authenticate

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/reset-password', AuthController.sendForgotPasswordLink)
router.post('/update-name', auth, AuthController.updateName)
router.post('/change-password', auth, AuthController.changePassword)
router.get('/me', auth, AuthController.getMe)
router.post('/user/delete', AuthController.deleteUser)

module.exports = router
