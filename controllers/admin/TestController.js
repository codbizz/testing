require("dotenv").config();
var mongoose = require("mongoose");
var fs = require('fs');
const QuestionModel = require("../../models/QuestionModel");
const TestModel = require("../../models/TestModel");

//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const deleteHelper = require("../../helpers/deleteHelper");

const { updateTest, removeQuestion } = require("../../validator/validator_function");
const SubjectModel = require("../../models/SubjectModel");
const FileToJson = require("../../helpers/excelFileParser")




exports.createTestSeries = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        //File to json
        var testData = await FileToJson(req.file.path);

        //insert questions
        var result = await QuestionModel.insertMany(testData.questionsArray, { session });
        var questionsIDs = result.map(d => d._id);

        //create new test series 
        var { title, set_id } = testData.testMetaDeta;
        await TestModel.create([{
            title,
            set_id,
            question_ids: questionsIDs
        }], { session });

        console.log("Test Series Created")
        await session.commitTransaction();

        return apiResponse.redirectWithFlashMsg(req, res, "/admin/set-detail/" + set_id, "Test Series And Questions Uploaded Success");


    } catch (error) {
        await session.abortTransaction();
        console.log("error while creating new test series")
        console.log(error)
        return res.render('admin/test_series/upload_screen.ejs', { user: req.user, error: error });
    } finally {
        // Ending the session and Deleting the Excel File
        fs.unlink(req.file.path, () => { });
        session.endSession();
    }
}


//Deleted Test Series and its question Post
exports.deleteTestSeries = async (req, res) => {
    try {
        const testId = req.body.test_id;
        if (testId == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Test Id Required");

        await deleteHelper.deleteTest(req.body.test_id)
        return apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), "Test Deleted");
    } catch (error) {
        console.log(error)
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
    }
}


exports.viewTestSeriesDetails = async (req, res) => {

    try {
        var testSeriesDetails = await TestModel.findById(req.params._id).populate('question_ids').populate('set_id', 'title');
        if (testSeriesDetails == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Test Not Found");
        var subjects = await SubjectModel.find();
        var subjectStrings = {};
        subjects.forEach((sub) => {
            subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
        })
        return res.render('admin/test_series/test_series_details.ejs', { user: req.user, testDetails: testSeriesDetails, subjectStrings, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        console.log(error)
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
    }
}

// exports.viewTestSeriesList = async (req, res) => {

//     try {
//         var testSeriesList = await TestModel.find().populate('set_id', 'title');
//         return res.render('admin/test_series/view_test_series_list.ejs', { user: req.user, testLists: testSeriesList, error: req.flash('error'), msg: req.flash('msg') });
//     } catch (error) {
//         console.log(error)
//         return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));

//     }
// }

exports.viewTestSeriesList = async (req, res) => {

    try {
        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: '-createdAt',
            populate: 'set_id',
            lean: { virtuals: true }
        };
        var filter = {}
        req.query.test_text ? filter['title.EN'] = { "$regex": `.*${req.query.test_text}.*`, $options: 'i' } : "";
        var testSeriesList = await TestModel.paginate(filter, options);
        return res.render('admin/test_series/test_series_paginated.ejs', { user: req.user, testListPaginated: testSeriesList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });
    } catch (error) {
        console.log(error)
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));

    }
}



exports.viewUpdateTestScreen = async (req, res) => {

    try {

        var testId = req.params._id;
        if (testId == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Test ID Required");
        var test = await TestModel.findById(testId);
        if (test == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Test Not Found");


        return res.render('admin/test_series/update_test_series_form.ejs', { user: req.user, testDetails: test, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        console.log(error)
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
    }
}


exports.updateTest = async (req, res) => {
    try {
        const result = await updateTest.validateAsync(req.body);
        const { test_id, title_english, title_hindi } = result;
        var subject = await TestModel.findByIdAndUpdate(test_id, { title: { EN: title_english, HI: title_hindi } }, { new: true });
        if (subject == null) return apiResponse.redirectWithFlashMsg(req, res, "/admin/dashboard", "Test Not Found");
        apiResponse.redirectWithFlashMsg(req, res, "/admin/test-series-detail/" + test_id, "Test Updated");
        return;
    } catch (error) {
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
        }
    }
}


exports.removeQuestion = async (req, res) => {
    try {

        const result = await removeQuestion.validateAsync(req.body);
        const { test_id, question_id } = result;
        await deleteHelper.deleteQuestionFromTest(test_id, question_id);
        return apiResponse.redirectWithFlashMsg(req, res, `/admin/test-series-detail/${test_id}`, "Question Removed From Test Series")

    } catch (error) {
        console.log(error);

        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);

        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));


        }
    }
}


