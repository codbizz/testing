var express = require("express");
const SubjectController = require("../../controllers/admin/SubjectController");
const SetController = require("../../controllers/admin/SetController");
const AdminController = require("../../controllers/admin/AdminController");
const UsersController = require("../../controllers/admin/UsersController");
const TestController = require("../../controllers/admin/TestController");
const ManagerTestController = require("../../controllers/admin/managerTestController");
const QuestionController = require("../../controllers/admin/QuestionController");
const TransactionController = require("../../controllers/admin/TransactionController");
const { upload } = require("../../middlewares/file_upload")
var { authenticateAdmin } = require("../../middlewares/jwt");
const DashboardController = require("../../controllers/admin/DashboardController");
const { getConfigList, updateConfig } = require("../../controllers/admin/ConfigController");
const { getCouponList, createCoupon, updateCoupon, deleteCoupon } = require("../../controllers/admin/CouponController");
var router = express.Router();


router.get("/", authenticateAdmin, (req, res) => {
    return res.redirect("dashboard");
});
//DashBoard
router.get("/dashboard", authenticateAdmin, DashboardController.getMyDashboard);


//Login Logout
router.get("/logout", authenticateAdmin, (req, res) => {
    res.clearCookie("session_token");
    res.redirect("login");
    return;
});

//Login
router.get("/login", authenticateAdmin, (req, res) => {
    return res.render('admin/login.ejs', { error: req.flash("error") });
});
router.post("/login", AdminController.login);
router.get("/forgot-password", AdminController.forgotPasswordGet);

//forgot password
router.post("/reset-password", AdminController.resetPassword);

//change password
router.post("/change-password", authenticateAdmin, AdminController.changePassword);
router.get("/change-password", authenticateAdmin, AdminController.changePasswordGet);

//By Super Admin
//router.post("/create-admin", authenticateAdmin, AdminController.register);

//Subject Routes
//Get List Of Subjests
// router.get("/subjects", authenticateAdmin, SubjectController.getSubjectList);
// router.post("/create-subject", authenticateAdmin, SubjectController.createSubject);
// router.post("/delete-subject", authenticateAdmin, SubjectController.deleteSubject);
// router.post("/update-subject", authenticateAdmin, SubjectController.updateSubject);
// router.get("/subject/:_id", authenticateAdmin, SubjectController.getSubjectDetails);
// router.get("/subjects", authenticateAdmin, SubjectController.getSubjectList);

//Set Routes
// router.post("/create-set", authenticateAdmin, SetController.createSet);
// router.get("/create-set", authenticateAdmin, SetController.createSetPage);
// router.get("/update-set/:_id", authenticateAdmin, SetController.updateSetScreen);
// router.post("/update-set/:_id", authenticateAdmin, SetController.updateSet);
// router.post("/activate-set", authenticateAdmin, SetController.activateSet);
// router.post("/de-activate-set", authenticateAdmin, SetController.deActivateSet);
// router.post("/delete-set", authenticateAdmin, SetController.deleteSet);
// router.get("/set-lists", authenticateAdmin, SetController.getSetLists);
// router.get("/set-detail/:_id", authenticateAdmin, SetController.setDetailScreen);


// config
// router.get("/config", authenticateAdmin, getConfigList);
// router.post("/config/update",authenticateAdmin,updateConfig)


// coupons
// router.get("/coupon", authenticateAdmin, getCouponList);
// router.post("/coupon/update",authenticateAdmin,updateCoupon)
// router.post("/coupon/create-coupon",authenticateAdmin,createCoupon)
// router.post("/coupon/delete/:coupon_id", authenticateAdmin, deleteCoupon);

//Test Routes
// router.get("/upload-test", authenticateAdmin, (req, res) => {
//     return res.render('admin/test_series/upload_screen.ejs', { user: req.user });
// });
// managers api start 
// Navigate to upload page
router.get("/upload-manager-test", authenticateAdmin, (req, res) => {
    return res.render('admin/test_series/upload_managers_upload_screen.ejs', { user: req.user });
});
// upload option img logo 
router.get("/upload-option-img", authenticateAdmin, (req, res) => {
    return res.render('admin/test_series/upload_option_img.ejs', { user: req.user });
});
// Add particular one question
// router.get("/add-manager-question", authenticateAdmin, (req, res) => {
//     console.log('ADMIN')
//     return res.render('admin/question/addNewManagersQuestion.ejs', { user: req.user, questionDetails, error: req.flash('error'), msg: req.flash('msg') });
//     // return res.render('admin/set/add_manager_question.ejs', { user: req.user });
//     // return res.render('admin/question/addNewManagersQuestion.ejs', { user: req.user });
// });
router.get("/add-manager-question", authenticateAdmin, ManagerTestController.createQuestionGet);
router.post("/add-manager-question", authenticateAdmin, upload.fields([{ name: 'explanation_image', maxCount: 1 }, { name: 'question_image', maxCount: 1 }, { name: 'options[0][image_url]', maxCount: 1 }, { name: 'options[1][image_url]', maxCount: 1 }, { name: 'options[2][image_url]', maxCount: 1 }, { name: 'options[3][image_url]', maxCount: 1 }]), ManagerTestController.createQuestionPost);
// download excel
router.get("/download-manager-test", authenticateAdmin, (req, res) => {
    console.log('ADMIN')
    return res.render('admin/test_series/upload_managers_upload_screen.ejs', { user: req.user });
});

// download CSV
router.get("/download-current-cvs", authenticateAdmin, ManagerTestController.downloadcsvfile);
router.get("/newcsvformat", authenticateAdmin, ManagerTestController.newcsvformat);


// Get all questions
router.get("/Managers-question-list", authenticateAdmin, ManagerTestController.ManagersviewQuestionsListPaginated);

// View uploaded option images
router.get("/view-options-imglist", authenticateAdmin, ManagerTestController.viewOptionsImgList);


// Upload manager questions 
router.post("/upload-manager-test", authenticateAdmin, ManagerTestController.createManagerTestSeries);
// update particular question
router.post("/update-manager-question", authenticateAdmin, upload.fields([{ name: 'explanation_image', maxCount: 1 }, { name: 'question_image', maxCount: 1 }, { name: 'options[0][image_url]', maxCount: 1 }, { name: 'options[1][image_url]', maxCount: 1 }, { name: 'options[2][image_url]', maxCount: 1 }, { name: 'options[3][image_url]', maxCount: 1 }]), ManagerTestController.updateManagerQuestion);

// upload option img
router.post("/upload-option-img", authenticateAdmin, upload.single('fileUpload'), ManagerTestController.uploadManagerOptionImg);
// delete selected img
router.get("/delete-uploaded-option-img/:_id", authenticateAdmin, ManagerTestController.deleteselectedImg);

// Get questions
router.get("/update-manager-question/:_id", authenticateAdmin, ManagerTestController.updateQuestionScreen);
// Managers api END
// router.post("/upload-test", authenticateAdmin, upload.single('fileUpload'), TestController.createTestSeries);
// router.get("/test-series-detail/:_id", authenticateAdmin, TestController.viewTestSeriesDetails);
// router.get("/test-lists", authenticateAdmin, TestController.viewTestSeriesList);
// router.get("/update-test/:_id", authenticateAdmin, TestController.viewUpdateTestScreen);
// router.post("/update-test", authenticateAdmin, TestController.updateTest);
// router.post("/delete-test", authenticateAdmin, TestController.deleteTestSeries);
// router.post("/remove-question", authenticateAdmin, TestController.removeQuestion);

//Question Routes
// router.get("/update-question/:_id", authenticateAdmin, QuestionController.updateQuestionScreen);
// router.post("/update-question", authenticateAdmin, QuestionController.updateQuestion);
// router.get("/create-question", authenticateAdmin, QuestionController.createQuestionGet);
// router.post("/create-question", authenticateAdmin, QuestionController.createQuestionPost);
// router.get("/question-list", authenticateAdmin, QuestionController.viewQuestionsListPaginated);
// router.get("/add-existing-question/:testId", authenticateAdmin, QuestionController.addExistingQuestionToTestGet);
// router.post("/add-existing-question", authenticateAdmin, QuestionController.addExistingQuestionToTest);

//Transaction Routes
// router.get("/transactions", authenticateAdmin, TransactionController.getTransactionList);
// router.post("/refresh-transaction", authenticateAdmin, TransactionController.refreshTransaction);

//users route
// router.get("/users-list", authenticateAdmin, UsersController.getUsersList)
// router.get("/results-list", authenticateAdmin, UsersController.getResultsList)



module.exports = router;