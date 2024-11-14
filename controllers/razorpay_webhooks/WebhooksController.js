require("dotenv").config();
const apiResponse = require("../../helpers/apiResponse");
const SetModel = require("../../models/SetModel");
const TransactionModel = require("../../models/TransactionModel");
var mongoose = require("mongoose");

const { createOrder, markOrderSuccess } = require("../../validator/validator_function");
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});
var { validatePaymentVerification, validateWebhookSignature } = require('../../helpers/razorpay-utils');
const UserModel = require("../../models/UserModel");


exports.handleWebhook = async (req, res) => {
    if (req.body.event && req.body.event == "order.paid") return await handleOrderPaid(req, res);
    else return res.send("ok");
}



async function handleOrderPaid(req, res) {
    if (req.get("X-Razorpay-Signature") == null || validateWebhookSignature(JSON.stringify(req.body), req.get("X-Razorpay-Signature"), process.env.WEBHOOK_SECRET) == false) {
        return apiResponse.ErrorResponse(res, "Signature validation failed");
    }


    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        var payment = req.body.payload.payment.entity;
        var order = req.body.payload.order.entity;


        var transaction = await TransactionModel.findOne({ order_id: order.id }).populate('set_id');
        if (!transaction) return apiResponse.successResponse(res, "No Transactions Found");

        transaction.status = order.status;
        transaction.attempts = order.attempts;
        transaction.razorpay_payment_id = payment.id;
        transaction.purchase_expire = (payment.created_at * 1000) + (1000 * 60 * 60 * 24 * transaction.set_id.days_to_expire);
        await transaction.save({ session });

        var user = await UserModel.findById(transaction.user_id);
        if (!user.purchased_set.includes(transaction.set_id._id)) {
            user.purchased_set.push(transaction.set_id._id);
            await user.save({ session });
        }


        await session.commitTransaction();
        return apiResponse.successResponse(res, "purchase Success")
    } catch (error) {
        await session.abortTransaction();
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else {
            console.log(error);
            apiResponse.ErrorServer(res, error.message);
        }
    } finally {
        await session.endSession();
    }
}

