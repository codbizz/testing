var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

var ManagersResultQuestionAnswerSchema = new mongoose.Schema({
    result_id: { type: Schema.Types.ObjectId ,ref: 'Managers_Result_Question_Answer' ,required: true },
    question_id: { type: Schema.Types.ObjectId,  required: true },
    correct_answer: { type: String, },
    answer_given: { type: String, },
    marks_obtained: { type: Number, required: true }
}, { timestamps: true });

ManagersResultQuestionAnswerSchema.plugin(mongoosePaginate);



module.exports = mongoose.model("Managers_Result_Question_Answer", ManagersResultQuestionAnswerSchema);