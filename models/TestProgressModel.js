var mongoose = require("mongoose");
const { Schema } = mongoose;


var TestProgressSchema = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    test_id: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    at_question_id: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    total_attempted: { type: Number, required: true },
    question_answer_json_string: { type: String }

}, { timestamps: true });






module.exports = mongoose.model("Test_Progress", TestProgressSchema);