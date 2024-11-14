require("dotenv").config();

const UserModel = require("../../models/UserModel");
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const SetModel = require("../../models/SetModel");
const ProjectManagersModel = require("../../models/ProjectManagersQuestions");





exports.getMyDashboard = async (req, res) => {
    try {
        // var totalSetSold = await TransactionModel.find({ status: "paid" }).count();
        // var totalUserRegistered = await UserModel.find().count();
        var questions_count = await ProjectManagersModel.find().count();

        return res.render('admin/dashboard.ejs', { data: { questions_count }, user: req.user, error: req.flash("error"), msg: req.flash("msg") });
    } catch (error) {
        console.log(error);

        if (error.isJoi) {
            return res.render('admin/dashboard.ejs', { data: { totalSetSold: "ERROR", totalUserRegistered: "ERROR" }, user: req.user, error: req.flash("error"), msg: req.flash("msg") });

        } else {
            return res.render('admin/dashboard.ejs', { data: { totalSetSold: "ERROR", totalUserRegistered: "ERROR" }, user: req.user, error: req.flash("error"), msg: req.flash("msg") });
        }
    }
}

