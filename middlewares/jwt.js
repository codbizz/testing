const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

const apiResponse = require('../helpers/apiResponse')

const UserModel = require('../models/UserModel')

// const authenticate1 = jwt({
// 	secret: secret,
// });

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (authHeader) {
    const token = authHeader.split(' ')[1]

    jwt.verify(token, secret, async (err, user) => {
      if (err) {
        apiResponse.unauthorizedResponse(res, 'Access Denied')  
        return
      }

      req.user = user
      req.token = token

      req.user_db = await UserModel.findById(user._id)
      if (req.user_db == null)
        return apiResponse.unauthorizedResponse(res, 'Access Denied')
      if (req.user_db.email == process.env.TESTING_AC_EMAIL) {
        req.user.is_tester = true
      }
      next()
    })
  } else {
    apiResponse.unauthorizedResponse(res, 'Access Denied')
  }
}

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.cookies.session_token
  //console.log(req.route.path)
  if (authHeader) {
    const token =   req.cookies.session_token
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        if (req.route.path == '/login') return next()
        else
          return apiResponse.redirectWithFlashError(
            req,
            res,
            'login',
            'Please Login First!'
          )
      }

      if (
        user.role == null ||
        (user.role != 'ADMIN' && user.role != 'SUPER_ADMIN')
      ) {
        if (req.route.path == '/login') return next()
        else
          return apiResponse.redirectWithFlashError(
            req,
            res,
            'login',
            'Please Login First!'
          )
      }

      req.user = user
      req.token = token
      if (req.route.path == '/login') return res.redirect('/admin/dashboard')

      next()
    })
  } else {
    if (req.route.path == '/login') next()
    else
      return apiResponse.redirectWithFlashError(
        req,
        res,
        'login',
        'Please Login First!'
      )
  }
}

module.exports = { authenticate, authenticateAdmin }
