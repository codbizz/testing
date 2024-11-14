var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const mongoosePaginate = require('mongoose-paginate-v2');

const subSchema = new mongoose.Schema({
    EN: { type: String, require: true },
    HI: { type: String, require: true }
}, { _id: false });

var SetSchema = new mongoose.Schema({
    title: { type: subSchema, required: true, index: { unique: true } },
    description: { type: subSchema, required: true },
    is_paid: { type: Boolean, default: false },
    amount: { type: Number, default: 0.0 },
    currency: { type: String, default: "INR" },
    days_to_expire: { type: Number },
    active: { type: Boolean, default: false },
    test_series_ids: [{ type: Schema.Types.ObjectId, ref: "Test" }],
    type: { type: String, required: true },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });


SetSchema.virtual('number_of_test_series').get(function () {
    return this.test_series_ids.length; 3
});


SetSchema.plugin(mongooseLeanVirtuals);
SetSchema.plugin(mongoosePaginate);

// Virtual for user's full name


module.exports = mongoose.model("Set", SetSchema);