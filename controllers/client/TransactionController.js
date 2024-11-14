require('dotenv').config()
const apiResponse = require('../../helpers/apiResponse')
const SetModel = require('../../models/SetModel')
const TransactionModel = require('../../models/TransactionModel')
var mongoose = require('mongoose')
const axios = require('axios')
const crypto = require('crypto')
const {
  createOrder,
  markOrderSuccess,
  phonePePGSchema
} = require('../../validator/validator_function')
const mailer = require('../../helpers/mailer')
const phonePe = require('../../helpers/phonepe_utils')

const { json } = require('express')
const { constants } = require('../../helpers/constants')
const PointTransaction = require('../../models/PointTransaction')
const Config = require('../../models/Config')
const Coupon = require('../../models/CouponModel')

exports.createOrder = async (req, res) => {
  // const session = await mongoose.startSession()
  // session.startTransaction()
  try {
    const inputData = await createOrder.validateAsync(req.body)
    var { set_id, platform,coupon_id } = inputData
    var user_id = req.user_db._id

    if (req.user_db.purchased_set.includes(set_id)) {
      return apiResponse.ErrorResponse(
        res,
        'Set Already purchased and have the validity'
      )
    }
    var set = await SetModel.findById(set_id)
      .select('amount days_to_expire currency title')
      .lean()

    if (!set) {
      // await session.abortTransaction();
      return apiResponse.ErrorResponse(res, 'Set Not Found')
    }

    if (set.is_paid == false) {
      // await session.abortTransaction();
      return apiResponse.ErrorResponse(res, 'Set is Free')
    }
    let amount = set.amount
    var transaction = await TransactionModel.findOne({
      user_id,
      set_id,
      status: { $ne: 'expired' }
    }).sort({ updatedAt: -1 })
    var shouldCreateNewOrder = false
    console.log("transaction::", transaction);
    if (transaction != null) {
      if (
        transaction.status == 'paid' &&
        transaction.purchase_expire > Date.now()
      ) {
        console.log('Set is Already purchased and have the validity')
        req.user_db.purchased_set.push(set_id)
        await req.user_db.save()
        // await session.abortTransaction();
        return apiResponse.ErrorResponse(
          res,
          'Set Already purchased and have the validity'
        )
      } else if (
        transaction.status == 'paid' &&
        transaction.purchase_expire < Date.now()
      ) {
        console.log('Previouse Purchase is Expiered')
        shouldCreateNewOrder = true
      }
    } else {
      shouldCreateNewOrder = true
    }



    if (!shouldCreateNewOrder) {
      console.log("shouldCreateNewOrder is false::");
      var response = await phonePe.initPhonePe(amount, true, platform)
    } else {
      // apply coupon flow
      if(coupon_id){
        const existingCoupon = await Coupon.findById(coupon_id);

        if (!existingCoupon) {
          return apiResponse.ErrorResponse(res, "Please enter a valid coupon");
        }

        if(existingCoupon.min_purchase_amount>amount){
          return apiResponse.ErrorResponse(res, `Minimum purchase amount for this coupoon is ${existingCoupon.min_purchase_amount}`);
        }

        if(existingCoupon.status == 'inactive'){
          return apiResponse.ErrorResponse(res, `Coupon is inactive`);
        }

        // Check if the coupon is expired
        const currentDate = new Date();
        const expiryDate = existingCoupon.expiry_date;

        if (expiryDate && currentDate > expiryDate) {
          return apiResponse.ErrorResponse(res, "Coupon has expired");
        }
        
        // discount calculation 
        let discount_amount = 0
        if(existingCoupon.amount){
          discount_amount = existingCoupon.amount
        }else if(existingCoupon.percentage){
          discount_amount = amount*existingCoupon/100
          if(existingCoupon.max_discount_amount<discount_amount){
            discount_amount = existingCoupon.max_discount_amount
          }
        }

        if(amount>discount_amount){
          amount = amount - discount_amount
        }else{
          amount = 0
        }

      }

      // reedem points 
      const configData = await Config.findOne({ key:'points_per_currency' }).exec();
  
      const points_per_currency =  Number(configData.value) 
      const points_to_be_used = inputData.points_to_be_used ? inputData.points_to_be_used : 0
      if (req.user_db.points && points_to_be_used) {
        let updatedPoints = 0
        if (points_to_be_used > req.user_db.points) {
          // await session.abortTransaction();
          return apiResponse.ErrorResponse(
            res,
            "You don't have sufficient points !"
          )
        }

        if (points_to_be_used >= amount * points_per_currency) {
          updatedPoints = req.user_db.points - (amount * points_per_currency)
          amount = 0
        } else {
          updatedPoints = req.user_db.points - points_to_be_used
          console.log("amount,points_to_be_used/points_per_currency::", amount, points_to_be_used / points_per_currency);
          amount = amount - points_to_be_used / points_per_currency
          console.log("amount::", amount);
        }

        // create transaction of points
        const transactionData = {
          user_id,
          set_id,
          initial_points: Number(req.user_db.points),
          final_points: updatedPoints,
          status: constants.pointsTransactionStatus.CREATED,
          difference: Number(req.user_db.points) - updatedPoints,
          action: constants.pointsTransaction.SUBSTRACT,
          reason: constants.pointsTransactionReason.ORDER_CREATED,
          comment: `${Number(req.user_db.points) - updatedPoints} ${constants.pointsTransactionComment.ORDER_CREATED} ${set.title.EN}`,
        }
        // console.log("transactionData::", transactionData);
        await PointTransaction.create([transactionData])
        req.user_db.points = updatedPoints
        req.user_db.save()
      }

      // create phonepee transaction 
      var objId = new mongoose.Types.ObjectId()
      var response = await phonePe.initPhonePe(amount, true, platform)
      var transaction = await TransactionModel.create({
        _id: objId,
        user_id,
        set_id,
        amount: (amount * 100).toFixed(2),
        order_id: response.data.merchantTransactionId,
        status: 'created',
        platform,
        gateway_type: 'PHONEPE',
        purchase_expire: new Date(
          new Date().setDate(new Date().getDate() + set.days_to_expire)
        ),
        user_email: req.user_db.email
      })
    }
    // console.log("transaction::", transaction);
    // await session.endSession();
    return apiResponse.successResponseWithData(res, '', response)
  } catch (error) {
    // await session.abortTransaction();
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error)
    } else {
      console.log(error)
      apiResponse.ErrorServer(res, error.message)
    }
  }
}

exports.markOrderSuccess = async (req, res) => {
  // const session = await mongoose.startSession()
  // session.startTransaction()
  try {
    const inputData = await markOrderSuccess.validateAsync(req.body)
    var { set_id } = inputData
    var transaction = await TransactionModel.findOne({
      user_id: req.user_db._id,
      set_id,
      status: { $nin: ['paid', 'expired'] }
    })
      .sort({ updatedAt: -1 })
      .populate('set_id')

    if (!transaction)
      return apiResponse.ErrorResponse(res, 'No Pending Transactions Found')
    var orderId = transaction.order_id.toString()
    const response = await phonePe.validatePaymentVerification(
      orderId,
      transaction.amount,
      true
    )
    console.log(response)

    await TransactionModel.updateOne(
      { order_id: orderId },
      {
        status: response.responseCode == 'SUCCESS' ? 'paid' : 'attempted',
        phone_pe_payment_id: response.transactionId,
        attempts: 1,
        purchase_expire:
          Date.now() * 1000 +
          1000 * 60 * 60 * 24 * transaction.set_id.days_to_expire
      }
      // 
    )
    if (response.responseCode != 'SUCCESS') {
      // await session.commitTransaction()
      return apiResponse.ErrorResponse(res, 'Order is Not Paid')
    }
    if (!req.user_db.purchased_set.includes(set_id)) {
      req.user_db.purchased_set.push(set_id)
      await req.user_db
        .save
        // 
        ()
    }
    // sendSuccessMail(req.user_db.email, { name: req.user_db.name, setName: transaction.set_id.title.EN, amount: (transaction.amount / 100) * 1.0, expireDate: purchase_expire, orderDate: transaction.updatedAt, orderId: transaction.order_id });
    // await session.commitTransaction()
    return apiResponse.successResponse(res, 'Purchase Successful')
  } catch (error) {
    console.log(error)
    return res.send(error)
  } finally {
    // await session.endSession()
  }
}

exports.fetchMyTransactions = async (req, res) => {
  try {
    var transactions = await TransactionModel.find({ user_id: req.user_db._id })
      .sort({ updatedAt: -1 })
      .populate('set_id', 'title')
      .lean()
    for (let index = 0; index < transactions.length; index++) {
      if (transactions[index]['set_id'] == null) {
        transactions[index]['set_details'] = {
          _id: '0',
          title: {
            EN: 'Set DELETED',
            HI: 'Set DELETED'
          }
        }
      } else
        delete Object.assign(transactions[index], {
          ['set_details']: transactions[index]['set_id']
        })['set_id']
    }
    return apiResponse.successResponseWithData(res, '', transactions)
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error)
    } else {
      console.log(error)
      apiResponse.ErrorServer(res, error.message)
    }
  }
}

// exports.refreshOrderStatus = async (req, res) => {
//   try {
//     const inputData = await createOrder.validateAsync(req.body)
//     var { set_id, platform } = inputData
//     var user_id = req.user_db._id
//     var instance = new Razorpay({
//       key_id: process.env.RAZOR_PAY_KEY,
//       key_secret: process.env.RAZOR_PAY_KEY_SECRET
//     })

//     var set = await SetModel.findById(set_id)
//       .select('amount days_to_expire currency title')
//       .lean()
//     if (!set) return apiResponse.ErrorResponse(res, 'Set Not Found')
//     if (set.is_paid == false)
//       return apiResponse.ErrorResponse(res, 'Set is Free')

//     var transaction = await TransactionModel.findOne({
//       user_id,
//       set_id,
//       status: { $ne: 'expired' }
//     }).sort({ updatedAt: -1 })
//     var shouldCreateNewOrder = false

//     if (transaction != null) {
//       if (
//         transaction.status == 'paid' &&
//         transaction.purchase_expire > Date.now()
//       ) {
//         console.log('Set is Already purchased and have the validity')
//         return apiResponse.ErrorResponse(
//           res,
//           'Set Already purchased and have the validity'
//         )
//       } else if (
//         transaction.status == 'paid' &&
//         transaction.purchase_expire < Date.now()
//       ) {
//         console.log('Previouse Purchase is Expiered')
//         shouldCreateNewOrder = true
//       }
//     } else {
//       shouldCreateNewOrder = true
//     }
//     if (!shouldCreateNewOrder) {
//     } else {
//       var objId = new mongoose.Types.ObjectId()
//       var order = await instance.orders.create({
//         amount: set.amount * 100,
//         currency: set.currency,
//         receipt: objId.toString(),
//         partial_payment: false,
//         notes: {
//           user_id: user_id.toString(),
//           set_id: set_id
//         }
//       })
//       var transaction = await TransactionModel.create({
//         _id: objId,
//         user_id,
//         set_id,
//         amount: order.amount,
//         attempts: order.attempts,
//         currency: order.currency,
//         order_id: order.id,
//         status: order.status,
//         platform,
//         purchase_expire: new Date(
//           new Date().setDate(new Date().getDate() + set.days_to_expire)
//         )
//       })
//     }

//     var flutterOption = {
//       key: process.env.RAZOR_PAY_KEY,
//       name: set.title.EN,
//       description: '',
//       order_id: transaction.order_id,
//       prefill: {
//         email: req.user_db.email
//       }
//     }
//     return apiResponse.successResponseWithData(res, '', flutterOption)
//   } catch (error) {
//     if (error.isJoi) {
//       apiResponse.validationErrorWithData(res, error.details[0].message, error)
//     } else {
//       console.log(error)
//       apiResponse.ErrorServer(res, error.message)
//     }
//   }
// }

exports.phonePeCallback = async (req, res) => {
  try {
    let b64string = req.body['response']
    let buffer = Buffer(b64string, 'base64')
    let decoded = JSON.parse(buffer.toString('utf8'))

    let data = decoded.data
    let orderId = data.merchantTransactionId

    await TransactionModel.updateOne(
      { order_id: orderId },
      {
        status: decoded.code == 'PAYMENT_SUCCESS' ? 'paid' : 'attempted',
        phone_pe_payment_id: data.transactionId,
        attempts: 1
      }
      // { session }
    )

    return apiResponse.successResponseWithData(res, '', req.body)
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error)
    } else {
      console.log(error)
      apiResponse.ErrorServer(res, error.message)
    }
  }
}
