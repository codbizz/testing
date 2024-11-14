require("dotenv").config();
var mongoose = require("mongoose");

const SetModel = require("../../models/SetModel");
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const { createSet, activateDeactivateSet } = require("../../validator/validator_function");
const SubjectModel = require("../../models/SubjectModel");
const TestModel = require("../../models/TestModel");
const deleteHelper = require("../../helpers/deleteHelper");



//Create Set Post[JSON API]
exports.createSet = async (req, res) => {
    try {
        const result = await createSet.validateAsync(req.body);
        const { title_english,
            title_hindi,
            description_english,
            description_hindi,
            is_paid,
            amount,
            currency,
            days_to_expire,
            active,
            type,
            subject_id } = result;
        var setExist = await SetModel.findOne({ "title.EN": { $regex: new RegExp(title_english, "i") } });
        if (setExist) return apiResponse.validationErrorWithData(res, "ERROR", "Set Title Already Exist");
        var set = await SetModel.create({
            title: { EN: title_english, HI: title_hindi },
            description: { EN: description_english, HI: description_hindi },
            is_paid,
            amount,
            currency,
            days_to_expire,
            active,
            type,
            subject_id: type == "SUBJECT" ? subject_id : undefined
        })
        apiResponse.successResponseWithData(res, "Created", set);
    } catch (error) {
        if (error.isJoi) {
            return apiResponse.validationErrorWithData(res, error.details[0].message, error.details[0].message)
        } else {
            return apiResponse.ErrorServer(res, error);
        }
    }
}


//Create Set Get Request
exports.createSetPage = async (req, res) => {
    try {
        var subjectList = await SubjectModel.find();
        return res.render('admin/set/create_set_page.ejs', { subjectList, user: req.user, error: req.flash("error"), msg: req.flash("msg") });
    } catch (error) {
        console.log(error);

        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), JSON.stringify(error));

        }
    }
}

exports.getSetLists = async (req, res) => {
    try {

        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: '-createdAt',
            lean: { virtuals: true }
        };
        var filter = {}
        req.query.subject_id ? filter.subject_id = req.query.subject_id : "";
        req.query.type ? filter.type = req.query.type : "";

        req.query.set_text ? filter['title.EN'] = { "$regex": `.*${req.query.set_text}.*`, $options: 'i' } : "";
        var subjects = await SubjectModel.find();
        var subjectStrings = {};
        subjects.forEach((sub) => {
            subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
        })

        var setLists = await SetModel.paginate(filter, options);

        return res.render('admin/set/view_set_paginated.ejs', { user: req.user, setListPaginated: setLists, subjectStrings, error: req.flash("error"), myvalue: req.query, msg: req.flash("msg") });
    } catch (error) {
        console.log(error);

        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), error.details[0].message);

        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), JSON.stringify(error));
        }
    }
}



//Update Set Get Request
exports.updateSetScreen = async (req, res) => {
    try {

        var setDetails = await SetModel.findById(req.params._id);
        var subjectList = await SubjectModel.find();

        return res.render('admin/set/update_set_screen.ejs', { user: req.user, setDetails, subjectList });

    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), error.details[0].message);

        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), JSON.stringify(error));

        }
    }
}


//Update set Post[JSON API]
exports.updateSet = async (req, res) => {
    try {

        const result = await createSet.validateAsync(req.body);
        const { title_english,
            title_hindi,
            description_english,
            description_hindi,
            is_paid,
            amount,
            currency,
            days_to_expire,
            active,
            type,
            subject_id } = result;

        var setExist = await SetModel.findOne({ _id: { $ne: req.params._id }, "title.EN": { $regex: new RegExp(title_english, "i") } });
        if (setExist) return apiResponse.validationErrorWithData(res, "ERROR", "Set Title Already Exist");

        var set = await SetModel.findByIdAndUpdate(req.params._id, {
            title: { EN: title_english, HI: title_hindi },
            description: { EN: description_english, HI: description_hindi },
            is_paid,
            amount: is_paid ? amount : 0,
            currency,
            days_to_expire: is_paid ? days_to_expire : undefined,
            active,
            type,
            subject_id: type == "MOCK" ? undeined : subject_id
        })

        return apiResponse.successResponseWithData(res, "Set Updated", set);
    } catch (error) {
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error.details[0].message)
        } else {
            apiResponse.ErrorServer(res, error);
        }
    }
}


//View Set Details Get request
exports.setDetailScreen = async (req, res) => {
    try {
        if (req.params._id == null) return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), "Invalid SET ID");

        var setDetails = await SetModel.findById(req.params._id).populate('subject_id').populate('test_series_ids', 'title question_count question_ids');
        var subjectList = await SubjectModel.find();
        if (setDetails == null) return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), "SET Not Found");
        return res.render('admin/set/set_detail_screen.ejs', { user: req.user, setDetails, subjectList, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), error.details[0].message);
            // apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else if (error.name == "CastError") {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), "Invalid SET ID");
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get("Referrer"), JSON.stringify(error));
        }
    }
}



//Activate Set Post[JSON API]
exports.activateSet = async (req, res) => {
    try {
        const result = await activateDeactivateSet.validateAsync(req.body)
        const { _id } = result;
        var setId = _id;

        var set = await SetModel.findById(setId);
        if (set) {
            if (set.test_series_ids.length < 1) {
                return apiResponse.ErrorResponse(res, "Please Add at least 1 test series before activating the set")
            }
            set.active = true;
            await set.save();
            return apiResponse.successResponse(res, "Set Activated");
        } else
            return apiResponse.ErrorResponse(res, "Set Not Found");

    } catch (error) {
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error.details[0].message)
        } else {

            apiResponse.ErrorServer(res, error);
        }
    }
}

//De-Activate Set Post[JSON API]
exports.deActivateSet = async (req, res) => {
    try {
        const result = await activateDeactivateSet.validateAsync(req.body)
        const { _id } = result;
        var setId = _id;

        var set = await SetModel.findById(setId);
        if (set) {
            set.active = false;
            await set.save();
            return apiResponse.successResponse(res, "Set De-Activated");
        } else
            return apiResponse.ErrorResponse(res, "Set Not Found");

    } catch (error) {

        if (error.isJoi) {

            apiResponse.validationErrorWithData(res, error.details[0].message, error.details[0].message)
        } else {
            apiResponse.ErrorServer(res, error);
        }
    }
}

//Delete Set Post
exports.deleteSet = async (req, res) => {
    try {
        if (req.body.set_id == null) throw "Set ID Required "
        await deleteHelper.deleteSet(req.body.set_id)
        return apiResponse.redirectWithFlashMsg(req, res, '/admin/set-lists', "Set Deleted");
    } catch (error) {
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, '/admin/set-lists', error.details[0].message);

        } else {
            return apiResponse.redirectWithFlashError(req, res, '/admin/set-lists', JSON.stringify(error));
        }
    }
}
