var mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const subSchema = new mongoose.Schema({
    EN: { type: String, require: true },
    img: { type: String, require: false },
    imgurl: { type: String, require: false },
    imgId: { type: String, require: false },
}, { _id: false });

const optionSsubSchema = new mongoose.Schema({
    id: { type: String, require: true },
    text: { type: subSchema, required: true },
    image_url: { type: String, require: false },
}, { _id: false });

const errorsSchema = new mongoose.Schema({
    error_text: { type: String, required: false },
    error_image: { type: String, required: false },
}, { _id: false });

var ProjectManagersSchema = new mongoose.Schema({
    s_no:{ type: Number},
    text: { type: subSchema, required: true },
    question_image: { type: String, required: false },
    options: [{ type: optionSsubSchema, required: true }],
    correct_answer_id: { type: String, required: true },
    // correct_answer_id: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], required: true },
    marks_per_question: { type: Number, default: 1 },
    minus_marks_per_question: { type: Number, default: 0.5 },
    explanation_in_english: { type: String, required: true },
    explanation_image: { type: String, required: false },
    active: { type: Boolean, default: true },
    is_error: { type: Boolean, default: false },
    error: [{ type: errorsSchema, required: false }],
}, { timestamps: true });

ProjectManagersSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("ProjectManagersQuestions", ProjectManagersSchema);