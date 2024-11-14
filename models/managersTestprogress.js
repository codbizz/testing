var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');
const subSchema = new mongoose.Schema({
    question_id: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    correct_answer: { type: String },
    answer_given: { type: String },
    marks_obtained: { type: Number }
}, { _id: false });
// const optionSsubSchema = new mongoose.Schema({
//     id: { type: String, require: true },
//     question : { type: subSchema, required: true }
// }, { _id: false });
var ManagersResultSchema = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // start
    at_question_id: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    page_index: { type: Number, required: true },
    // end
    total_marks: { type: Number, required: true },
    marks_obtained: { type: Number, required: true },
    attempted_questions_count: { type: Number, required: true },
    not_attempted_questions_count: { type: Number, required: true },
    wrong_answers_count: { type: Number, required: true },
    correct_answers_count: { type: Number, required: true },
    total_positive_marks: { type: Number, required: true },
    total_negative_marks: { type: Number, required: true },
    options: [{ type: subSchema, required: true }],
    // new fields
    quiz_number: { type: Number, required: true },
    progress_status: { type: String, required: true },
    progress_total_time: { type: String, required: true },

}, { timestamps: true });


ManagersResultSchema.plugin(mongoosePaginate);


module.exports = mongoose.model("Managers_Test_Progress", ManagersResultSchema);