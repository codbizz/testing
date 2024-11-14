require("dotenv").config();

//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const bcrypt = require("bcrypt");
const { updateTest, removeQuestion } = require("../../validator/validator_function");
const SetModel = require("../../models/SetModel");
const SubjectModel = require("../../models/SubjectModel");
const TestModel = require("../../models/TestModel");
const TestProgressModel = require("../../models/TestProgressModel");



exports.getAvailableSetsPaginated = async (req, res) => {

    try {
        const options = {
            page: req.query.page ?? 1,
            limit: req.query.limit ?? 10,
            sort: '-updatedAt',
            lean: { virtuals: true }
        };
        var filter = { active: true };
        if (req.user.is_tester)
            filter = {};

        if (req.query.type) filter.type = req.query.type;
        if (req.query.subject_id) filter.subject_id = req.query.subject_id;

        var sets = await SetModel.paginate(filter, options);
        for (let i = 0; i < sets.docs.length; i++) {
            sets.docs[i].already_purchased = req.user_db.purchased_set.includes(sets.docs[i]._id)
            delete sets.docs[i]['test_series_ids'];
        }
        apiResponse.successResponseWithData(res, "", sets);

    } catch (error) {
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else {
            console.log(error);
            apiResponse.ErrorServer(res, error);
        }
    }
}


exports.getSetWithTestsList = async (req, res) => {
    try {
        if (req.params.id == null) return apiResponse.ErrorResponse(res, "SET ID Required");
        var set = await SetModel.findById(req.params.id).populate('test_series_ids', "title question_ids").lean({ virtuals: true });
        if (set == null) return apiResponse.ErrorResponse(res, "SET Not Found");

        for (let index = 0; index < set.test_series_ids.length; index++) {
            set.test_series_ids[index].question_count = set.test_series_ids[index].question_ids.length;
            delete set.test_series_ids[index].question_ids;
            if (req.user_db.ongoing_tests.includes(set.test_series_ids[index]._id)) {

                set.test_series_ids[index].is_ongoing = true

            }

            set.test_series_ids[index].is_completed = req.user_db.results.includes(set.test_series_ids[index]._id)
        }
        delete Object.assign(set, { ['test_series']: set['test_series_ids'] })['test_series_ids'];
        set.already_purchased = req.user_db.purchased_set.includes(set._id);

        apiResponse.successResponseWithData(res, "", set);

    } catch (error) {
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else if (error.name == "CastError") {
            return apiResponse.ErrorResponse(res, "Invalid Set ID");
        }
        else {
            console.log(error);
            apiResponse.ErrorServer(res, error);
        }
    }
}



exports.getSubjects = async (req, res) => {
    try {
        var subjects = await SubjectModel.find().lean();
        return apiResponse.successResponseWithData(res, "", subjects);
    } catch (error) {
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else if (error.name == "CastError") {
            return apiResponse.ErrorResponse(res, "Invalid Set ID");
        }
        else {
            console.log(error);
            apiResponse.ErrorServer(res, error);
        }
    }
}

exports.getTestDetails = async (req, res) => {
    try {
        if (req.params.id == null) return apiResponse.ErrorResponse(res, "TEST ID Required");
        var test = await TestModel.findById(req.params.id).populate("set_id", "title is_paid").lean();
        if (!test) return apiResponse.ErrorResponse(res, "Test Not Found");
        if (test.set_id.is_paid == true) {
            //check For Purchase
            if (!req.user_db.purchased_set.includes(test.set_id._id)) {
                return apiResponse.ErrorResponse(res, "You need to purchase the Set")
            }            // 

        }
        test.is_ongoing = req.user_db.ongoing_tests.includes(test._id)
        test.is_completed = req.user_db.results.includes(test._id)


        //temprory fix for total marks field 
        test.total_marks = test.question_ids.length * 1;

        return apiResponse.successResponseWithData(res, "", test);
    } catch (error) {
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else if (error.name == "CastError") {
            return apiResponse.ErrorResponse(res, "Invalid Set ID");
        }
        else {
            console.log(error);
            apiResponse.ErrorServer(res, error);
        }
    }
}


