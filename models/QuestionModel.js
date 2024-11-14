var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');


const subSchema = new mongoose.Schema({
    EN: { type: String, require: true },
    HI: { type: String, require: true }
}, { _id: false });


const optionSsubSchema = new mongoose.Schema({
    id: { type: String, require: true },
    text: { type: subSchema, required: true }
}, { _id: false });

var QuestionSchema = new mongoose.Schema({
    text: { type: subSchema, required: true },
    options: [{ type: optionSsubSchema, required: true }],
    correct_answer_id: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], required: true },
    marks_per_question: { type: Number, default: 1 },
    minus_marks_per_question: { type: Number, default: 0.5 },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", require: true },
    explanation_in_english: { type: String, required: true },
    explanation_in_hindi: { type: String, required: true },

    active: { type: Boolean, default: true }

}, { timestamps: true });


QuestionSchema.plugin(mongoosePaginate);


module.exports = mongoose.model("Question", QuestionSchema);