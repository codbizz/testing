require("dotenv").config();

const AdminModel = require("../../models/AdminModel");
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const { loginSchema, changePasswordSchema, forgotPasswordAdmin } = require("../../validator/validator_function");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var flash = require('connect-flash');

const mailer = require("../../helpers/mailer");




exports.login = async (req, res) => {
    try {
        const result = await loginSchema.validateAsync(req.body);
        const { email, password } = result;
        var admin = await AdminModel.findOne({ email }).select("+password");
        if (admin == null) {
            return apiResponse.redirectWithFlashError(req, res, "login", "Account Not Found,please sign up first")

        }

        if (admin.status != "ACTIVE") return apiResponse.redirectWithFlashError(req, res, "login", "Account is not Active,Please Contact Super Admin");

        var passwordMatched = await bcrypt.compare(password, admin.password);
        if (passwordMatched == false) {
            return apiResponse.redirectWithFlashError(req, res, "login", "Invalid passwsord");
        }

        var adminData = { _id: admin.id, email: admin.email, name: admin.name, role: admin.role };
        const jwtData = {
            expiresIn: '1 day',
        };
        const secret = process.env.JWT_SECRET;
        //Generated JWT token with Payload and secret.
        adminData.token = jwt.sign(adminData, secret, jwtData);
        req.user = adminData;
        res.cookie('session_token', adminData.token, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
        return apiResponse.redirectWithFlashError(req, res, "dashboard", "Login Successs");
    } catch (error) {

        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, "/admin/login", error.details[0].message);
        } else {

            return apiResponse.redirectWithFlashError(req, res, "/admin/login", error);
        }
    }
}

exports.changePassword = async (req, res) => {
    try {
        const result = await changePasswordSchema.validateAsync(req.body);
        const { currunt_password, new_password } = result;
        var email = req.user.email;
        var admin = await AdminModel.findOne({ email }).select("+password");
        if (admin == null) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Account Not Found,please sign up first")
        }

        if (admin.status != "ACTIVE") return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Account is not Active,Please Contact Super Admin");

        var passwordMatched = await bcrypt.compare(currunt_password, admin.password);
        if (passwordMatched == false) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Old password is Invalid");
        }

        admin.password = bcrypt.hashSync(new_password, 10);
        await admin.save()

        return apiResponse.redirectWithFlashMsg(req, res, "/admin/dashboard", "Password Change Success");
    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
        } else {

            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error);
        }
    }
}


exports.changePasswordGet = async (req, res) => {
    try {
        return res.render('admin/password_reset.ejs', { user: req.user, error: req.flash("error"), msg: req.flash("msg") });

    } catch (error) {

        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, "/admin/login", error.details[0].message);
        } else {

            return apiResponse.redirectWithFlashError(req, res, "login", error);
        }
    }
}

exports.forgotPasswordGet = async (req, res) => {
    try {
        return res.render('admin/forgot_password.ejs', { error: req.flash("error"), msg: req.flash("msg") });

    } catch (error) {

        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, "/admin/login", error.details[0].message);
        } else {

            return apiResponse.redirectWithFlashError(req, res, "login", error);
        }
    }
}



exports.resetPassword = async (req, res) => {
    try {
        const result = await forgotPasswordAdmin.validateAsync(req.body);
        const { email, dob } = result;
        var admin = await AdminModel.findOne({ email }).select("+password");
        if (admin == null) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Account Not Found")
        }

        if (admin.dob != dob) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Invalid Date Of Birth");
        var newPassowrd = Math.random().toString(36).slice(-8);
        admin.password = bcrypt.hashSync(newPassowrd, 10);

        await admin.save()
        mailer.send(process.env.EMAIL_FROM, admin.email, `Password Reset-${process.env.APP_NAME ?? "MOCK TEST"}`, `Your new Passwod is ${newPassowrd}`);

        return apiResponse.redirectWithFlashError(req, res, "/admin/login", "New Password Sent To your email address");
    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
        } else {

            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error);
        }
    }
}








// exports.register = async (req, res) => {
//     try {
//         // if (req.user == null || req.user.role !== "SUPER_ADMIN") return apiResponse.unauthorizedResponse(res, "Only Super Admin Can Create new Admin");
//         const result = await registerSchema.validateAsync(req.body);
//         const { name, email, password } = result;

//         var isAlreadyIn = await AdminModel.findOne({ email });
//         if (isAlreadyIn) {
//             apiResponse.ErrorResponse(res, "E-mail already in use,please login")
//             return;
//         }

//         let hash = await bcrypt.hash(password, 10);
//         var adminM = new AdminModel(
//             {
//                 name,
//                 email,
//                 password: hash,
//             }
//         );
//         var user = await adminM.save();
//         //Prepare JWT token for authentication
//         apiResponse.successResponseWithData(res, "Admin Created Success.", user);
//         return;
//     } catch (error) {
//         if (error.isJoi) {
//             apiResponse.validationErrorWithData(res, error.details[0].message, error)
//         } else {
//             console.log(error);
//             apiResponse.ErrorServer(res, error);
//         }
//     }
// };
