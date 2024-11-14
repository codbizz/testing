var mongoose = require("mongoose");


var AdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true, select: false },
    status: { type: String, default: "ACTIVE" },
    role: { type: String, default: "ADMIN" },
    dob: { type: String, required: true },

}, { timestamps: true });

// Virtual for user's full name


module.exports = mongoose.model("Admin", AdminSchema);