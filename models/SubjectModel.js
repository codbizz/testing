var mongoose = require("mongoose");



var SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true, index: { unique: true } },
    number_id: { type: Number, required: true, index: { unique: true, sparse: true } }
}, { timestamps: true });


module.exports = mongoose.model("Subject", SubjectSchema);