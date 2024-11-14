var mongoose = require("mongoose");
var QuestionTestRelation = require("./QuestionTestRelation");
const SetModel = require("./SetModel");
const mongoosePaginate = require('mongoose-paginate-v2');

const { Schema } = mongoose;

const subSchema = new mongoose.Schema({
    EN: { type: String, require: true },
    HI: { type: String, require: true }
}, { _id: false });

var TestSchema = new mongoose.Schema({
    title: { type: subSchema, required: true },
    question_ids: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    set_id: { type: mongoose.Schema.Types.ObjectId, ref: "Set" }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });


TestSchema.virtual('question_count').get(function () {
    return this.question_ids.length;
});

TestSchema.post('save', async function (next) {
    console.log("Test Save Middleware Fired");
    // Make Realtionalship between 
    var rel = [];
    this.question_ids.forEach((questionId) => {
        rel.push({ question_id: questionId, test_id: this._id })
    });
    await QuestionTestRelation.deleteMany({ test_id: this._id })
    await QuestionTestRelation.insertMany(rel);

    var set = await SetModel.findById(this.set_id);
    if (!set.test_series_ids.includes(this._id)) {
        set.test_series_ids.push(this._id);
        await set.save();
    }
});
TestSchema.plugin(mongoosePaginate);

// TestSchema.post('remove', async function (next) {
//     try {
//         console.log("Trying To Remove Question");
//         var questionsToRemove = [];
//         this.question_ids.forEach(async (questionId) => {
//             var relation = await QuestionTestRelation.find({ question_id: questionId });
//             if (relation.length == 1) {
//                 questionsToRemove.push(relation[0]._id);
//             }
//         });
//         //delete questions
//         await QuestionModel.deleteMany({ _id: { $in: questionsToRemove } });

//         //delete RelationShip    
//         await QuestionTestRelation.deleteMany({ test_id: this._id });

//         next()
//     } catch (err) {
//         next(err)
//     }
// });


module.exports = mongoose.model("Test", TestSchema);