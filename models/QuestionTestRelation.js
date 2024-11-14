var mongoose = require("mongoose");



var QuestionTestRelationSchema = new mongoose.Schema({
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    test_id: { type: mongoose.Schema.Types.ObjectId, ref: "Test" }
}, { timestamps: true });


module.exports = mongoose.model("Question_Test_Relation", QuestionTestRelationSchema);