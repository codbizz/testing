const { number } = require("joi");
var mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');
// const over_all_result_type = new mongoose.Schema({
//     total_quiz_attempted:{ type: Number, default: 0 },
//     avarage: { type: Number, default: 0 },
//     total_mark_obtained: { type: Number, default: 0 },
//     totalAttemptedQuestions: { type: Number, default: 0 },
//     totalNotAttemptedQuestions: { type: Number, default: 0 },
//     totalMinusMarking: { type: Number, default: 0 },
//     totalPositiveMarking: { type: Number, default: 0 },
//     // HI: { type: String, require: true }
// }, { _id: false });

// const result_type = new mongoose.Schema({
//     result_ids: [{ type: Schema.Types.ObjectId, ref: "Result" }],
//     over_all_result: { type: over_all_result_type, require: false },
   
//     // HI: { type: String, require: true }
// }, { _id: false });
var UserSchema = new mongoose.Schema({
	name: { type: String, required: true, },
	email: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true, select: false },
	ongoing_tests: [{ type: Schema.Types.ObjectId, ref: "Test" }],
	results: [{ type: Schema.Types.ObjectId, ref: "Result" }],
	// attempted_Set: [{ type: Number,}],
	attempted_Set: [{
        page: { type: Number},
        resultId: { type: Schema.Types.ObjectId},
      }],
	// results: { type: result_type, required: true },
	purchased_set: [{ type: Schema.Types.ObjectId, ref: "Set" }],
	points: { type: Number, default: 0 },
}, { timestamps: true });


UserSchema.plugin(mongoosePaginate);


module.exports = mongoose.model("User", UserSchema);