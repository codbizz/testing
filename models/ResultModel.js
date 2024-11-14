var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');
const subSchema = new mongoose.Schema({
    question_id: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    answer_given: { type: String },
    marks_obtained: { type: Number, required: true }
}, { _id: false });

var ResultSchema = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    test_id: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    total_marks: { type: Number, required: true },
    marks_obtained: { type: Number, required: true },
    attempted_questions_count: { type: Number, required: true },
    not_attempted_questions_count: { type: Number, required: true },
    wrong_answers_count: { type: Number, required: true },
    correct_answers_count: { type: Number, required: true },
    total_positive_marks: { type: Number, required: true },
    total_negative_marks: { type: Number, required: true },
    // question_wise_details: [{ type: subSchema, required: true }]

}, { timestamps: true });


ResultSchema.plugin(mongoosePaginate);


module.exports = mongoose.model("Result", ResultSchema);