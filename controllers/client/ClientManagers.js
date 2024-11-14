require("dotenv").config();

//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const bcrypt = require("bcrypt");
const { updateTest, removeQuestion } = require("../../validator/validator_function");
const SetModel = require("../../models/SetModel");
const SubjectModel = require("../../models/SubjectModel");
const TestModel = require("../../models/TestModel");
const TestProgressModel = require("../../models/TestProgressModel");
const ProjectManagersModel = require("../../models/ProjectManagersQuestions");

// quations list 
exports.ManagersviewQuestionsListPaginated = async (req, res) => {
    try {
        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: 's_no',
            lean: { virtuals: true }
        };
        var filter = {}
        // req.query.subject_id ? filter.subject_id = req.query.subject_id : "";
        req.query.question_text ? filter['text.EN'] = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
        // var subjects = await SubjectModel.find();
        // var subjectStrings = {};
        // subjects.forEach((sub) => {
        //     subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
        // })
        var questionList = await ProjectManagersModel.paginate(filter, options);
        // let data ={}
        // return data ={ user: req.user, questionDetailsPaginated: questionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') }
        return res.json({
            user: req.user,
            questionDetailsPaginated: questionList,
            myvalue: req.query,
            error: req.flash('error'),
            msg: req.flash('msg')
          });
        // return res.render('admin/question/managers_question_list_paginated.ejs', { user: req.user, questionDetailsPaginated: questionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
    }
}
exports.UnauthorizedusersQuestionList10 = async (req, res) => {
    try {
        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: '-updatedAt',
            lean: { virtuals: true }
        };
        if(options.limit>20)
        {
            options.limit=20;
        }
        var filter = {}
        // req.query.subject_id ? filter.subject_id = req.query.subject_id : "";
        req.query.question_text ? filter['text.EN'] = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
        // var subjects = await SubjectModel.find();
        // var subjectStrings = {};
        // subjects.forEach((sub) => {
        //     subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
        // })
        var questionList = await ProjectManagersModel.paginate(filter, options);
        // let data ={}
        // return data ={ user: req.user, questionDetailsPaginated: questionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') }
        return res.json({
            user: req.user,
            questionDetailsPaginated: questionList,
            myvalue: req.query,
            error: req.flash('error'),
            msg: req.flash('msg')
          });
        // return res.render('admin/question/managers_question_list_paginated.ejs', { user: req.user, questionDetailsPaginated: questionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
    }
}

// Get question details 
exports.getQuestionScreen = async (req, res) => {
    try {
        var questionDetails = await ProjectManagersModel.findById(req.params._id)
        // .populate('subject_id');
        if (questionDetails == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Question Not Found");
        // var subjectList = await SubjectModel.find();
        return res.json({
            user: req.user,
            questionDetails: questionDetails,
            myvalue: req.query,
            error: req.flash('error'),
            msg: req.flash('msg')
          });
        // return res.render('admin/question/update_managers_question_screen.ejs', { user: req.user, questionDetails, error: req.flash('error'), msg: req.flash('msg') });
    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get("Refferer"), error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
        }
    }
}