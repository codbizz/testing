const mongoose = require("mongoose");
const QuestionTestRelationModel = require("../models/QuestionTestRelation");
const SetModel = require("../models/SetModel");
const TestModel = require("../models/TestModel");
const QuestionModel = require("../models/QuestionModel");
const ResultModel = require("../models/ResultModel");


exports.deleteTest = async (testId,) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        var test = await TestModel.findById(testId);

        //Find the Questions that are used in Multiple tests
        var res = await QuestionTestRelationModel.aggregate([
            { $match: { question_id: { $in: test.question_ids } } },
            {
                $group: {
                    _id: '$question_id',
                    countNumberOfDocumentsForState: { $sum: 1 }
                }
            },
            {
                $sort: {
                    countNumberOfDocumentsForState: -1
                }
            },
            {
                $match: {
                    countNumberOfDocumentsForState: { $gt: 1 }
                }
            }
        ]);
        var notToDeleteId = res.map((e) => e._id.toString());
        var questionsToDelete = test.question_ids;

        //filter out multi used questions
        notToDeleteId.forEach((e) => {
            if (questionsToDelete.includes(e)) {
                const index = questionsToDelete.indexOf(e);
                questionsToDelete.splice(index, 1);
            }
        });


        //delete question
        await QuestionModel.deleteMany({ _id: { $in: questionsToDelete } }, { session });
        //delete reation 
        await QuestionTestRelationModel.deleteMany({ test_id: test._id }, { session });
        //delete ref from Set
        var set = await SetModel.findById(test.set_id);
        if (set) {
            let index = set.test_series_ids.indexOf(testId);
            if (index > -1) {
                set.test_series_ids.splice(index, 1);
                await set.save()
            }
        }


        await ResultModel.deleteMany({ test_id: test._id }, { session })
        await TestModel.findByIdAndRemove(testId, { session })
        await session.commitTransaction();
        return true;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }

}


exports.deleteSet = async (setId) => {

    const session = await mongoose.startSession();
    session.startTransaction();
    try {

        var set = await SetModel.findById(setId);
        if (set == null) throw "Set Not Found";
        for (var i = 0; i < set.test_series_ids.length; i++) {
            var testId = set.test_series_ids[i];
            var test = await TestModel.findById(testId);
            if (test == null) continue;
            //Find the Questions that are used in Multiple tests
            var res = await QuestionTestRelationModel.aggregate([
                { $match: { question_id: { $in: test.question_ids } } },
                {
                    $group: {
                        _id: '$question_id', countNumberOfDocumentsForState: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        countNumberOfDocumentsForState: -1
                    }
                },
                {
                    $match: {
                        countNumberOfDocumentsForState: { $gt: 1 }
                    }
                }
            ]);
            var notToDeleteId = res.map((e) => e._id.toString());
            var questionsToDelete = test.question_ids;
            //filter out multi used questions
            notToDeleteId.forEach((e) => {
                if (questionsToDelete.includes(e)) {
                    const index = questionsToDelete.indexOf(e);
                    questionsToDelete.splice(index, 1);
                }
            });
            //delete question
            await QuestionModel.deleteMany({ _id: { $in: questionsToDelete } }, { session });
            //delete reation 
            await QuestionTestRelationModel.deleteMany({ test_id: test._id }, { session });
            await ResultModel.deleteMany({ test_id: test._id }, { session })
            console.log("HERE");
            await TestModel.findByIdAndRemove(testId, { session })

        }
        await SetModel.findByIdAndRemove(setId, { session })
        await session.commitTransaction();
        return true;
    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }

}


exports.deleteQuestionFromTest = async (test_id, question_id) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        var test = await TestModel.findById(test_id);
        if (test == null) throw "Test Not Found";
        if (test.question_ids.length <= 2) throw "Last Question Can't be deleted";
        var question = await QuestionModel.findById(question_id);
        if (question == null) throw "Question Not Found";
        var index = test.question_ids.indexOf(question_id);
        if (index > -1) {
            test.question_ids.splice(index, 1)
        }
        await test.save({ session });

        var relation = await QuestionTestRelationModel.find({ question_id });
        if (relation.length <= 1) {
            await QuestionModel.findByIdAndDelete(question_id, { session })
        }
        //await QuestionTestRelationModel.deleteOne({ question_id }, { session });
        await session.commitTransaction();
        return true;
    } catch (error) {
        console.log(error)
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}