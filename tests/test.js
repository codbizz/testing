require('dotenv').config()
var MONGODB_URL = process.env.MONGODB_URL
var mongoose = require('mongoose')
const TestModel = require('../models/TestModel')
const SetModel = require('../models/SetModel')
const QuestionModel = require('../models/QuestionModel')
const ResultModel = require('../models/ResultModel')
const ResultQuestionAnswerModel = require('../models/ResultQuestionAnswerModel')
const TransactionModel = require('../models/TransactionModel')
const UserModel = require('../models/UserModel')
let ejs = require('ejs')
const Razorpay = require('razorpay')
const mailer = require('../helpers/mailer')

const QuestionTestRelation = require('../models/QuestionTestRelation')

mongoose
  .connect(MONGODB_URL)
  .then(async () => {
    //don't show the log when it is test

    if (process.env.NODE_ENV !== 'test') {
      console.log('Connected to %s', MONGODB_URL)
      console.log('App is running ... \n')
      console.log('Press CTRL + C to stop the process. \n')
    }

    //await refreshPendingTransationStatus()

    var html = await ejs.renderFile(
      `${process.cwd()}/views/email_tamplate/payment_success.ejs`,
      {
        name: 'Rohit Manglani',
        amount: 100.0,
        setName: 'UPSC SET A 2023',
        expireDate: 'May 24 2023',
        orderId: 'qwert123456',
        orderDate: Date(Date.now()).toLocaleLowerCase(),
        logo_url: `${process.env.APP_DOMAIN}/logo.png`
      }
    )
    await mailer.send(
      'Hackerkernek@k.com',
      'hardevdresses@gmail.com',
      'Purchase Success - UPSC SET A 2023 -' + process.env.APP_NAME,
      html
    )
    process.exit(1)
  })
  .catch(err => {
    console.error('App starting error:', err.message)
    process.exit(1)
  })

async function sendSuccessMail () {
  // mailer.send("hackerkernel@a.com", req.user_db.email, `Purchase Successfull - ${ transaction.set_id.title.en }`,res.renderFile(""))
}

async function removeExpiredPurchase () {
  var expiredPurchase = await TransactionModel.find({
    status: 'paid',
    purchase_expire: { $lt: Date.now() + 1000 * 60 * 60 * 24 * 40 }
  }).select('user_id set_id')
  console.log(
    `Found ${expiredPurchase.length} Expired Purchase, Now removing Them`
  )
  for (let index = 0; index < expiredPurchase.length; index++) {
    const userSet = expiredPurchase[index]
    var user = await UserModel.findById(userSet.user_id)
    if (!user) return
    if (user.purchased_set.includes(userSet.set_id)) {
      user.purchased_set = user.purchased_set.filter(
        item => item.toString() != userSet.set_id.toString()
      )
      console.log(user.purchased_set)
      await user.save()
    }
    userSet.attempts = 999
    await userSet.save()
  }
}

async function refreshPendingTransationStatus () {
  console.log('Refreshing Pending Transactions')
  try {
    var instance = new Razorpay({
      key_id: process.env.RAZOR_PAY_KEY,
      key_secret: process.env.RAZOR_PAY_KEY_SECRET
    })
    var transactions = await TransactionModel.find({
      status: { $in: ['created', 'attempted'] }
    }).populate('set_id', 'days_to_expire')
    console.log(`found ${transactions.length} Pending Transactions`)
    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index]
      var set_id = transaction.set_id._id
      console.log('Updating ' + transaction._id)
      var razorPayOrder = await instance.orders.fetch(transaction.order_id)
      if (
        razorPayOrder.status == transaction.status &&
        razorPayOrder.attempts == transaction.attempts
      ) {
        console.log('No Update')
        continue
      }
      transaction.status = razorPayOrder.status
      transaction.attempts = razorPayOrder.attempts

      if (razorPayOrder.status == 'paid') {
        var razorPayments = await instance.orders.fetchPayments(
          transaction.order_id
        )

        for (let index = 0; index < razorPayments.items.length; index++) {
          const pay = razorPayments.items[index]
          if (pay.status == 'captured') {
            var razorPayment = pay
          }
        }
        if (!razorPayment) continue

        purchase_expire =
          razorPayment.created_at * 1000 +
          1000 * 60 * 60 * 24 * transaction.set_id.days_to_expire
        transaction.purchase_expire = purchase_expire
        transaction.razorpay_payment_id = razorPayment.id
        var user = await UserModel.findById(transaction.user_id)

        if (user.purchased_set.includes(set_id)) {
          await transaction.save()
          continue
        }
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
          await transaction.save({ session })
          user.purchased_set.push(transaction.set_id)
          await user.save({ session })
          await session.commitTransaction()
        } catch (error) {
          console.log(`Error while refreshing pendind transctions ${error} `)
          await session.abortTransaction()
        } finally {
          await session.endSession()
        }
        continue
      }
      await transaction.save()
    }
  } catch (error) {
    console.log(`Error while refreshing pendind transctions ${error} `)
  }
}
