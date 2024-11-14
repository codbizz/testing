require("dotenv").config();
var mongoose = require("mongoose");
var fs = require('fs');
const QuestionModel = require("../../models/QuestionModel");
const TestModel = require("../../models/TestModel");

//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const deleteHelper = require("../../helpers/deleteHelper");

const { updateQuestion, createQuestion } = require("../../validator/validator_function");
const SubjectModel = require("../../models/SubjectModel");
const FileToJson = require("../../helpers/excelFileParser")



//Update Question Get Request
exports.updateQuestionScreen = async (req, res) => {
    try {
        var questionDetails = await QuestionModel.findById(req.params._id).populate('subject_id');
        if (questionDetails == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Question Not Found");
        var subjectList = await SubjectModel.find();
        return res.render('admin/question/update_question_screen.ejs', { user: req.user, questionDetails, subjectList, error: req.flash('error'), msg: req.flash('msg') });
    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get("Refferer"), error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
        }
    }
}


//Update Question Post[Json API]
exports.updateQuestion = async (req, res) => {
    try {
        const result = await updateQuestion.validateAsync(req.body)
        const { question_id,
            question_in_english,
            question_in_hindi,
            correct_option,
            explanation_in_english,
            explanation_in_hindi,
            subject_id,
            options } = result;

        options.forEach(element => {
            if (element.EN != null && element.HI == null) {
                return apiResponse.validationErrorWithData(res, error.details[0].message, error)
            }
        });

        await QuestionModel.findByIdAndUpdate(question_id, {
            text: { EN: question_in_english, HI: question_in_hindi },
            correct_answer_id: correct_option,
            explanation_in_english,
            explanation_in_hindi,
            options,
            subject_id
        })
        return apiResponse.successResponse(res, "Question Updated");
    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error.details[0].message)
        } else {
            apiResponse.ErrorServer(res, error);
        }
    }
}


//Create Question Get Request
exports.createQuestionGet = async (req, res) => {
    try {
        const testId = req.query.testId;
        var subjectList = await SubjectModel.find();

        return res.render('admin/question/add_new_question.ejs', { user: req.user, testId, subjectList, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
        }
    }
}


//Create Question Post[Json API]
exports.createQuestionPost = async (req, res) => {
    try {
        const result = await createQuestion.validateAsync(req.body)
        const {
            test_id,
            question_in_english,
            question_in_hindi,
            correct_option,
            explanation_in_english,
            explanation_in_hindi,
            subject_id,
            options } = result;

        options.forEach(element => {
            if (element.EN != null && element.HI == null) {
                return apiResponse.validationErrorWithData(res, error.details[0].message, error)
            }
        });

        var test = await TestModel.findById(test_id);
        if (test == null) return apiResponse.ErrorResponse(res, "Invalid Test ID");
        var subject = await SubjectModel.findById(subject_id);
        if (subject == null) return apiResponse.ErrorResponse(res, "Invalid Subject ID");

        var question = new QuestionModel({
            text: { EN: question_in_english, HI: question_in_hindi },
            correct_answer_id: correct_option,
            explanation_in_english,
            explanation_in_hindi,
            options,
            subject_id
        });

        await question.save()
        await test.question_ids.push(question._id);
        await test.save();
        return apiResponse.successResponse(res, "Question Added");

    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error.details[0].message)
        } else if (error.name == "CastError") {
            apiResponse.ErrorServer(res, "Invalid Test ID");
        }
        else {
            apiResponse.ErrorServer(res, JSON.stringify(error));
        }
    }
}



exports.viewQuestionsListPaginated = async (req, res) => {
    try {
        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: '-updatedAt',
            lean: { virtuals: true }
        };
        var filter = {}
        req.query.subject_id ? filter.subject_id = req.query.subject_id : "";
        req.query.question_text ? filter['text.EN'] = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
        var subjects = await SubjectModel.find();
        var subjectStrings = {};
        subjects.forEach((sub) => {
            subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
        })
        var questionList = await QuestionModel.paginate(filter, options);
        return res.render('admin/question/question_list_paginated.ejs', { user: req.user, questionDetailsPaginated: questionList, subjectStrings, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
    }
}


exports.addExistingQuestionToTestGet = async (req, res) => {
    try {
        if (req.params.testId == null || req.params.testId == "") return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Test ID Rrequired");
        var testId = req.params.testId;
        var test = await TestModel.findById(testId).populate('set_id', 'type subject_id').lean();
        if (!test) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Test Not Found");

        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: '-updatedAt',
            lean: { virtuals: true }
        };
        var filter = { _id: { $nin: test.question_ids } };
        if (test.set_id.type == "SUBJECT")
            filter.subject_id = test.set_id.subject_id;
        else
            req.query.subject_id ? filter.subject_id = req.query.subject_id : "";

        req.query.question_text ? filter['text.EN'] = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";

        if (test.set_id.type == "SUBJECT")
            var subjects = await SubjectModel.find({ _id: test.set_id.subject_id });
        else
            var subjects = await SubjectModel.find();

        var subjectStrings = {};
        subjects.forEach((sub) => {
            subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
        })
        var questionList = await QuestionModel.paginate(filter, options);
        return res.render('admin/test_series/add_questions_in_test.ejs', { user: req.user, questionDetailsPaginated: questionList, subjectStrings, testDetail: test, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        console.log(error);
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer') ?? "/admin/dashboard", JSON.stringify(error));
    }
}

exports.addExistingQuestionToTest = async (req, res) => {
    try {
        const { test_id, question_id } = req.body;
        var test = await TestModel.findById(test_id);
        if (test == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer') ?? "/admin/dashboard", "Test Not Found");
        if (test.question_ids.includes(question_id)) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer') ?? "/admin/dashboard", "Question is already in the test series");
        await test.question_ids.push(question_id);
        await test.save();
        apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer') ?? "/admin/dashboard", "Question Added");
    } catch (error) {
        console.log(error);
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer') ?? "/admin/dashboard", JSON.stringify(error));
    }
}
