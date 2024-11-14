var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

var ResultQuestionAnswerSchema = new mongoose.Schema({
    result_id: { type: Schema.Types.ObjectId, ref: "Result", required: true },
    question_id: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    answer_given: { type: String, },
    marks_obtained: { type: Number, required: true }
}, { timestamps: true });

ResultQuestionAnswerSchema.plugin(mongoosePaginate);



module.exports = mongoose.model("Result_Question_Answer", ResultQuestionAnswerSchema);