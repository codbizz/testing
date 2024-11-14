const { default: mongoose } = require("mongoose");
const mailer = require("../../helpers/mailer");
const ejs = require("ejs");


const sendSuccessMail = async (toEmail, { name, amount, setName, expireDate, orderId, orderDate }) => {
    try {
        const fromEmailAdress = process.env.EMAIL_FROM;
        const subject = `Purchase Success - ${setName} - ${process.env.APP_NAME.toUpperCase()}`
        var d = new Date(expireDate);
        var html = await ejs.renderFile(`${process.cwd()}/views/email_tamplate/payment_success.ejs`, { name, amount, setName, expireDate: d, orderId, orderDate, app_logo: `${process.env.APP_DOMAIN}/logo.png` });
        var response = await mailer.send(fromEmailAdress, toEmail, subject, html);
        return response;
    } catch (error) {
        console.log(error)
        return false;
    }

}

const sendSuccessMailFromDb = async (transactionID, orderID) => {
    try {
        var transaction = await mongoose.model("Transaction").findById(transactionID).populate('set_id', "title").populate('user_id', 'name email');
        transaction.email_sent = transaction.email_sent ?? false;

        if (transaction && transaction.email_sent == false && transaction.status == "paid") {
            await sendSuccessMail(transaction.user_id.email, { name: transaction.user_id.name, amount: (transaction.amount / 100) * 1.0, expireDate: transaction.purchase_expire, orderId: transaction.order_id, orderDate: transaction.orderDate, setName: transaction.set_id.title.EN })
            transaction.email_sent = true;
            await transaction.save()
        }
    } catch (error) {
        console.log(error)
    }
}

const sendSuccessMailFromDbByOrderId = async (order_id) => {
    try {
        var transaction = await mongoose.model("Transaction").findOne({ order_id }).populate('set_id').populate('user_id', 'name email');
        transaction.email_sent = transaction.email_sent ?? false;
        if (transaction && transaction.email_sent == false) {
            await sendSuccessMail(transaction.user_id.email, { name: transaction.user_id.name, amount: (transaction.amount / 100) * 1.0, expireDate: transaction.purchase_expire, orderId: transaction.order_id, orderDate: transaction.orderDate, setName: transaction.set_id.title.EN })
            transaction.email_sent = true;
            await transaction.save()
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = { sendSuccessMail, sendSuccessMailFromDb, sendSuccessMailFromDbByOrderId };