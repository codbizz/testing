var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

var option_imgs = new mongoose.Schema({
    title: { type: String, required: true },
    filename: { type: String, required: true },

    active: { type: Boolean, default: true }

}, { timestamps: true });


option_imgs.plugin(mongoosePaginate);


module.exports = mongoose.model("option_imgs", option_imgs);