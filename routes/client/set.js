var express = require('express')
const ClientController = require('../../controllers/client/ClientController')
const ClientManagers = require('../../controllers/client/ClientManagers')
const ClientTestController = require('../../controllers/client/ClientTestController')
const TransactionController = require('../../controllers/client/TransactionController')
const { authenticate } = require('../../middlewares/jwt')
const { getCoupons } = require('../../controllers/client/CouponController')
var router = express.Router()
var auth = authenticate

router.get('/sets-available', auth, ClientController.getAvailableSetsPaginated)
router.get('/set/:id', auth, ClientController.getSetWithTestsList)
router.get('/test/:id', auth, ClientController.getTestDetails)
router.get('/my-sets', auth, ClientTestController.getMySets)
router.get('/subjects', auth, ClientController.getSubjects)
router.get('/managers_question', ClientManagers.ManagersviewQuestionsListPaginated)
router.get('/try_pack_questionlist', ClientManagers.UnauthorizedusersQuestionList10)
// Get questions
router.get("/get-manager-question/:_id", ClientManagers.getQuestionScreen);
router.post(
  '/get-full-questions',
  auth,
  ClientTestController.getFullQuestionByIds
)
router.post(
  '/question-contact-us',
  ClientTestController.questionContactUs
)

// router.post('/generate-result', auth, ClientTestController.generateResult)
router.post('/generate-result',auth ,ClientTestController.generateManagersResult)
// router.get('/result/:result_id', auth, ClientTestController.getResult)
router.get('/result/:result_id',auth, ClientTestController.getManagersResult)
router.get('/ongoing-tests', auth, ClientTestController.getAllOngoingTest)
// router.get('/results', auth, ClientTestController.getAllResults)
router.get('/results',auth, ClientTestController.getAllManagersResults)
// router.get(
//   '/question-answers/:result_id',
//   auth,
//   ClientTestController.getQuestionAnswers
// )
router.get('/question-answers/:result_id',auth,  ClientTestController.getManagersQuestionAnswers)
// router.post('/save-progress', auth, ClientTestController.saveTestProgress)
router.post('/save-progress',auth ,ClientTestController.saveTestProgress)
router.get('/get-progress',auth ,ClientTestController.getTestProgress)
router.get('/quiz-list',auth, ClientTestController.getAllQuizlists)
router.get('/quiz-list-without-login', ClientTestController.getAllQuizlistsWithoutLogin)

router.delete('/delete-user-records/:user_id', ClientTestController.resetQuiz)
// router.get(
//   '/retrieve-progress/:testId',
//   auth,
//   ClientTestController.retrieveTestProgress
// )

//payment routes
router.post('/create-order', auth, TransactionController.createOrder)
router.post('/order-success', auth, TransactionController.markOrderSuccess)
router.get('/my-transactions', auth, TransactionController.fetchMyTransactions)
router.post('/phonepe-callback', TransactionController.phonePeCallback)

// coupons
router.get('/coupon',auth,getCoupons)

module.exports = router
