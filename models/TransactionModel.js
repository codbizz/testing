var mongoose = require('mongoose')
const { Schema } = mongoose
const mongoosePaginate = require('mongoose-paginate-v2')
const m = require('../controllers/service/service_functions')

var TransactionSchema = new mongoose.Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    set_id: { type: Schema.Types.ObjectId, ref: 'Set', required: true },
    amount: { type: Number, required: true },
    attempts: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    order_id: { type: String, required: true, index: { unique: true } },
    status: {
      type: String,
      required: true,
      enum: ['created', 'attempted', 'paid', 'expired'],
      default: 'created'
    },
    payment_gateway_tid: { type: String },
    razorpay_payment_id: { type: String },
    phone_pe_payment_id: { type: String },
    platform: { type: String, required: true },
    gateway_type: { type: String, default: 'RAZORPAY' },
    purchase_expire: { type: Number, required: true },
    user_email: { type: String, required: true },
    request_json: { type: String },
    response_json: { type: String },
    email_sent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

TransactionSchema.plugin(mongoosePaginate)
// TransactionSchema.post("findOneAndUpdate", function () {
//     console.log("HERE " + (this.status == "paid" && !this.email_sent));
//     if (this.status == "paid" && !this.email_sent) {
//         m.sendSuccessMailFromDb(this._id)
//     }
// });

TransactionSchema.post('save', async function () {
  if (this.status == 'paid' && !this.email_sent) {
    m.sendSuccessMailFromDb(this._id)
  }
})

TransactionSchema.post('updateOne', async function () {
  if (this.getUpdate().$set.status == 'paid') {
    m.sendSuccessMailFromDbByOrderId(this.getQuery().order_id)
  }
})

module.exports = mongoose.model('Transaction', TransactionSchema)
