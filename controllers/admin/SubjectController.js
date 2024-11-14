require("dotenv").config();

const SubjectModel = require("../../models/SubjectModel");
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const { createSubject, deleteSubject, updateSubject } = require("../../validator/validator_function");
const QuestionModel = require("../../models/QuestionModel");
const SetModel = require("../../models/SetModel");

exports.login = async (req, res) => {

}

exports.createSubject = async (req, res) => {
    try {
        const result = await createSubject.validateAsync(req.body);
        const { name } = result;
        var lastSubject = await SubjectModel.findOne().sort('-number_id');
        var numberId = 1001;
        if (lastSubject)
            numberId = lastSubject.number_id + 1;
        var subject = await SubjectModel.create({
            name,
            number_id: numberId
        });
        return apiResponse.redirectWithFlashMsg(req, res, "subjects", "Subject Created success");
    } catch (error) {
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
            apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));

            apiResponse.ErrorServer(res, error);
        }
    }
}

exports.deleteSubject = async (req, res) => {
    try {
        const result = await deleteSubject.validateAsync(req.body);
        const { _id } = result;
        //check for Set that are depending on this subject
        if (await SetModel.findOne({ subject_id: _id })) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Can not Delete this subject because it is used by Some Sets");
        }
        //check For questions that are depending on this subject
        if (await QuestionModel.findOne({ subject_id: _id })) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Can not Delete this subject because it is used by Some Questions");
        }
        await SubjectModel.findByIdAndDelete(_id);
        return apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), "Subject Deleted success");

    } catch (error) {
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
        }
    }
}


exports.getSubjectList = async (req, res) => {
    try {
        var allSubject = await SubjectModel.find();
        return res.render('admin/subject/subject_page.ejs', { subjectList: allSubject, user: req.user, error: req.flash("error"), msg: req.flash("msg") });

    } catch (error) {
        if (error.isJoi) {
            apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), error.details[0].message)
        } else {
            apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), JSON.stringify(error))
        }
    }
}

exports.updateSubject = async (req, res) => {
    try {
        const result = await updateSubject.validateAsync(req.body);
        const { name, _id } = result;
        var subject = await SubjectModel.findByIdAndUpdate(_id, { name }, { new: true });
        if (subject == null) return apiResponse.notFoundResponse(res, "Subject Not Found");
        apiResponse.redirectWithFlashMsg(req, res, "subjects", "Subject Updated");
        return;
    } catch (error) {
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, "subjects", error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, "subjects", JSON.stringify(error));
        }
    }
}


exports.getSubjectDetails = async (req, res) => {
    try {
        if (req.params._id == null) return apiResponse.validationErrorWithData(res, "Subject Id is required", {});
        var subject = await SubjectModel.findById(req.params._id);
        apiResponse.successResponseWithData(res, "Subject Fetched", subject);
        return;
    } catch (error) {
        if (error.isJoi) {
            apiResponse.validationErrorWithData(res, error.details[0].message, error)
        } else {
            apiResponse.ErrorServer(res, error);
        }
    }
}