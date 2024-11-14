const TransactionModel = require("../../models/TransactionModel");
const apiResponse = require("../../helpers/apiResponse");
var mongoose = require("mongoose");
const Razorpay = require('razorpay');
const UserModel = require("../../models/UserModel");


exports.getTransactionList = async (req, res) => {

    try {
        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: '-updatedAt',
            populate: 'set_id',
            lean: {}
        };
        var filter = {}
        req.query.user_email ? filter.user_email = req.query.user_email : "";
        req.query.status ? filter.status = req.query.status : "";
        req.query.set_id ? filter.set_id = req.query.set_id : "";
        req.query.order_id ? filter.order_id = req.query.order_id : "";

        // req.query.order_id ? filter.order_id = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
        var transactionList = await TransactionModel.paginate(filter, options);

        return res.render('admin/transaction/transaction_list.ejs', { user: req.user, transactionDetailsPaginated: transactionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });
    } catch (error) {
        console.log(error);
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.toString());
    }
}


exports.refreshTransaction = async (req, res) => {

    try {
        var instance = new Razorpay({
            key_id: process.env.RAZOR_PAY_KEY,
            key_secret: process.env.RAZOR_PAY_KEY_SECRET,
        });
        if (req.body.transaction_id == null || req.body.transaction_id == "") return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Transaction id required");
        const transaction = await TransactionModel.findById(req.body.transaction_id).populate('set_id');
        if (!transaction) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Transaction Not Found");
        if (transaction.set_id == null) {
            transaction.set_id = { _id: 0, title: { EN: "SET DELETED" }, days_to_expire: 0 };
        }
        var set_id = transaction.set_id._id;
        console.log("Updating " + transaction._id)
        var razorPayOrder = await instance.orders.fetch(transaction.order_id);
        if (razorPayOrder.status == transaction.status && razorPayOrder.attempts == transaction.attempts) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Updated");
        };
        transaction.status = razorPayOrder.status;
        transaction.attempts = razorPayOrder.attempts;


        if (razorPayOrder.status == "paid") {
            var razorPayments = await instance.orders.fetchPayments(transaction.order_id)

            for (let index = 0; index < razorPayments.items.length; index++) {
                const pay = razorPayments.items[index];
                if (pay.status == "captured") {
                    var razorPayment = pay;
                }

            }
            if (!razorPayment) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Updated");


            purchase_expire = (razorPayment.created_at * 1000) + (1000 * 60 * 60 * 24 * transaction.set_id.days_to_expire);

            transaction.purchase_expire = purchase_expire;
            transaction.razorpay_payment_id = razorPayment.id;
            var user = await UserModel.findById(transaction.user_id);
            transaction.user_email = user.email;
            if (user.purchased_set.includes(set_id)) {

                await transaction.save();
                return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Updated");
            }
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                await transaction.save({ session });
                user.purchased_set.push(transaction.set_id);
                await user.save({ session });
                await session.commitTransaction();
            } catch (error) {
                console.log(`Error while refreshing pendind transctions ${error}`)
                await session.abortTransaction();
            } finally { await session.endSession(); }

            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Updated");
        }
        await transaction.save()
    } catch (error) {
        console.log(error);
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.toString());
    }
}