const TransactionModel = require('../../models/TransactionModel')
const UserModel = require('../../models/UserModel')
const Razorpay = require('razorpay')
var mongoose = require('mongoose')

//it will remove Set Reference from User.purchases_set when purchase is expired
const removeExpiredPurchase = async () => {
  var expiredPurchase = await TransactionModel.find({
    status: 'paid',
    attempts: { $ne: 999 },
    purchase_expire: { $lt: Date.now() }
  }).select('user_id set_id')
  console.log(
    `Found ${expiredPurchase.length} Expired Purchase , Now removing Them`
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
    userSet.status = 'expired'
    await userSet.save()
  }
}

const refreshPendingTransationStatus = async () => {
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
      if (transaction.set_id == null) {
        transaction.set_id = {
          _id: 0,
          title: { EN: 'SET DELETED' },
          days_to_expire: 0
        }
      }
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
          console.log(`Error while refreshing pendind transctions ${error}`)
          await session.abortTransaction()
        } finally {
          await session.endSession()
        }
        continue
      }

      await transaction.save()
    }
  } catch (error) {
    console.log(`Error while refreshing pendind transctions ${error}`)
  }
}

module.exports = { refreshPendingTransationStatus, removeExpiredPurchase }
