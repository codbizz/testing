require("dotenv").config();
const TestProgressModel = require("../models/TestProgressModel");
const UserModel = require("../models/UserModel");
const ManagersResult = require("../models/ManagersResultModel");
const managersTestprogressModel = require("../models/managersTestprogress");
const ResultModel = require('../models/ResultModel')
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const ejs = require("ejs");
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateNameSchema,
  resetPassword,
} = require("../validator/validator_function");

/**
 * User registration.
 *
 * @param {string}      name
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */

exports.register = async (req, res) => {
  try {
    const result = await registerSchema.validateAsync(req.body);
    const { name, email, password } = result;

    var isAlreadyIn = await UserModel.findOne({ email });
    if (isAlreadyIn) {
      apiResponse.ErrorResponse(res, "E-mail already in use,please login");
      return;
    }

    let hash = await bcrypt.hash(password, 10);
    var userM = new UserModel({
      name,
      email,
      password: hash,
    });
    var user = await userM.save();
    //Prepare JWT token for authentication
    const jwtPayload = { _id: user._id, email: user.email, name: user.name };
    const jwtData = {
      expiresIn: process.env.JWT_TIMEOUT_DURATION,
    };
    const secret = process.env.JWT_SECRET;
    //Generated JWT token with Payload and secret.
    jwtPayload.token = jwt.sign(jwtPayload, secret, jwtData);
    apiResponse.successResponseWithData(
      res,
      "Registration Success.",
      jwtPayload
    );
    return;
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.login = async (req, res) => {
  try {
    const result = await loginSchema.validateAsync(req.body);
    const { email, password } = result;
    console.log(result);
    var user = await UserModel.findOne({ email }).select("+password");
    if (user == null) {
      // apiResponse.ErrorResponse(res, "Account Not Found,please sign up first");
      apiResponse.ErrorResponse(
        res,
        "Incorrect email or Not registered. Please double-check your email."
      );
      return;
    }
    console.log(password, user.password, user);
    var passwordMatched = await bcrypt.compare(password, user.password);
    if (passwordMatched == false) {
      apiResponse.ErrorResponse(res, "Invalid Password");
      return;
    }

    var userData = { _id: user.id, email: user.email, name: user.name };
    const jwtData = {
      expiresIn: process.env.JWT_TIMEOUT_DURATION,
    };
    const secret = process.env.JWT_SECRET;
    //Generated JWT token with Payload and secret.
    userData.token = jwt.sign(userData, secret, jwtData);
    apiResponse.successResponseWithData(res, "Login Successfull", userData);
    return;
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.changePassword = async (req, res) => {
  try {
    const result = await changePasswordSchema.validateAsync(req.body);
    const { currunt_password, new_password } = result;
    var user = await UserModel.findById(req.user._id).select("+password");
    if (user) {
      var passwordMatched = await bcrypt.compare(
        currunt_password,
        user.password
      );
      if (passwordMatched == false) {
        apiResponse.ErrorResponse(res, "Current Password is Invalid");
        return;
      }
      let hash = await bcrypt.hash(new_password, 10);
      user.password = hash;
      await user.save();
      apiResponse.successResponse(res, "Password Changed Successfully");
      return;
    }
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.updateName = async (req, res) => {
  try {
    const result = await updateNameSchema.validateAsync(req.body);
    const { name } = result;
    var user = await UserModel.findById(req.user._id);
    if (user) {
      user.name = name;
      await user.save();
      var data = {
        name: user.name,
        email: user.email,
        _id: user._id,
        token: req.token,
      };
      apiResponse.successResponseWithData(
        res,
        "Name updated Successfully",
        data
      );
      return;
    }
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.getMe = async (req, res) => {
  try {
    console.log("me api called");

    const pipeline = [
      {
        $match: {
          _id: req.user_db._id,
        },
      },
      {
        $lookup: {
          from: "managers_test_progresses",
          let: {
            user_id: "$$ROOT._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$$user_id", "$user_id"],
                    },
                    {
                      $eq: ["$progress_status", "Done"],
                    },
                  ],
                },
              },
            },
          ],
          as: "quiz_progress_data",
        },
      },
      {
        $lookup: {
          from: "managers_test_progresses",
          let: {
            user_id: "$$ROOT._id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$$user_id", "$user_id"],
                    },
                    {
                      $eq: ["$progress_status", "Done"],
                    },
                  ],
                },
              },
            },
            {
              $sort: { createdAt: -1 } // Sort by createdAt in descending order
            },
            {
              $limit: 20 // Limit to the latest 20 records
            },
            {
              $project: {
                quiz_number: 1,
                quiz_percentage: {
                  $multiply: [
                    {
                      $sum: "$options.marks_obtained",
                    },
                    10,
                  ],
                },
                createdAt: 1
              }
            }
          ],
          as: "quiz_progress_data_for_percentage",
        },
      },
      {
        $lookup: {
          from: "managersresults",
          localField: "_id",
          foreignField: "user_id",
          as: "quiz_generated_results",
        },
      },
      {
        $addFields: {
          quiz_result: "$quiz_progress_data",
        },
      },
      {
        $addFields: {
          total_taken_quiz: {
            $size: "$quiz_result",
          },
          latest_quiz: {
            $map: {
              input: "$quiz_result",
              as: "item",
              in: {
                quiz_number: "$$item.quiz_number",
                quiz_name: {
                  $concat: [
                    "Quiz ",
                    {
                      $toString: "$$item.quiz_number",
                    },
                  ],
                },
                quiz_percentage: {
                  $multiply: [
                    {
                      $sum: "$$item.options.marks_obtained",
                    },
                    10,
                  ],
                },
                result_id: {
                  $arrayElemAt: [
                    "$quiz_generated_results._id",
                    {
                      $indexOfArray: [
                        "$quiz_generated_results.quiz_number",
                        "$$item.quiz_number",
                      ],
                    },
                  ],
                },
              },
            },
          },
          totalQuizTimeInSeconds: {
            $reduce: {
              input: "$quiz_result.progress_total_time",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $add: [
                      {
                        $multiply: [
                          {
                            $toInt: {
                              $substr: ["$$this", 0, 2],
                            },
                          },
                          3600,
                        ],
                      },
                      {
                        $multiply: [
                          {
                            $toInt: {
                              $substr: ["$$this", 3, 2],
                            },
                          },
                          60,
                        ],
                      },
                      {
                        $toInt: {
                          $substr: ["$$this", 6, 2],
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
          numberOfQuizzes: {
            $size: "$quiz_result.progress_total_time",
          },
        },
      },
      {
        $addFields: {
          averageTimeInSeconds: {
            $cond: {
              if: {
                $and: [
                  {
                    $gt: ["$totalQuizTimeInSeconds", 0],
                  }, // Check if totalQuizTimeInSeconds is greater than 0
                  { $gt: ["$numberOfQuizzes", 0] }, // Check if numberOfQuizzes is greater than 0
                ],
              },
              then: {
                $divide: ["$totalQuizTimeInSeconds", "$numberOfQuizzes"],
              },
              else: 0,
            },
          },
          latest_10: { $slice: ["$quiz_progress_data_for_percentage", 0, 10] },
          previous_10: { $slice: ["$quiz_progress_data_for_percentage", 10, 10] },
        },
      },
      {
        $addFields: {
          avg_latest_10: { $avg: "$latest_10.quiz_percentage" },
          avg_previous_10: { $avg: "$previous_10.quiz_percentage" },
        },
      },
      {
        $addFields: {
          percentage_difference: {
            $subtract: ["$avg_latest_10", "$avg_previous_10"]
          }
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          ongoing_tests: 1,
          results: 1,
          purchased_set: 1,
          createdAt: 1,
          updatedAt: 1,
          attempted_Questions: 1,
          attempted_Set: 1,
          points: 1,
          quiz_result: 1,
          total_taken_quiz: 1,
          latest_quiz: 1,
          average_time_per_quiz: "$averageTimeInSeconds",
          percentage_difference: 1,
        },
      },
    ];
    var [user] = await UserModel.aggregate(pipeline);

    user.token = req.token;
    apiResponse.successResponseWithData(
      res,
      "User Profile get successfully!",
      user
    );
    return;
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.sendForgotPasswordLink = async (req, res) => {
  try {
    if (req.body.email == null)
      return apiResponse.ErrorResponse(res, "Email is Required");
    const { email } = req.body;
    var user = await UserModel.findOne({ email }).select("+password").lean();
    if (user) {
      var adminData = { email };
      const jwtData = {
        expiresIn: "1 day",
      };
      const secret = user.password;
      //Generated JWT token with Payload and secret.
      resetToken = jwt.sign(adminData, secret, jwtData);
      var html = await ejs.renderFile(
        `${process.cwd()}/views/email_tamplate/password_reset_link.ejs`,
        {
          name: user.name,
          resetLink: `${process.env.APP_DOMAIN}/reset-password/${resetToken}`,
          logo_urln: `${process.env.APP_DOMAIN}/logo.png`,
        }
      );
      await mailer.send(
        process.env.EMAIL_FROM,
        email,
        `Password Reset -${process.env.APP_NAME.toUpperCase()}`,
        html
      );
      apiResponse.successResponse(res, "Password Reset Link Sent To Your Mail");
      return;
    } else {
      return apiResponse.ErrorResponse(res, "Account Not Found");
    }
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.passwordResetForm = async (req, res) => {
  try {
    if (req.params.resetToken == null)
      return res.render("user/invalid_link.ejs");
    const { resetToken } = req.params;
    var decoded = jwt.decode(resetToken);
    if (!decoded) return res.render("user/invalid_link.ejs");
    var email = decoded.email;
    var user = await UserModel.findOne({ email }).select("+password").lean();
    if (!user) return res.render("user/invalid_link.ejs");
    const secret = user.password;
    var resa = jwt.verify(resetToken, secret);
    if (!resa) return res.render("user/invalid_link.ejs");
    return res.render("user/password_reset_form.ejs", { resetToken });
  } catch (error) {
    if (error.isJoi) {
      return res.render("user/invalid_link.ejs");
    } else {
      return res.render("user/invalid_link.ejs");
    }
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password } = await resetPassword.validateAsync(
      req.body
    );
    var decoded = jwt.decode(reset_token);
    var email = decoded.email;
    var user = await UserModel.findOne({ email }).select("+password");
    if (!user) return res.rander("user/invalid_link.ejs");
    const secret = user.password;
    var resa = jwt.verify(reset_token, secret);
    if (!resa) return res.render("user/invalid_link.ejs");

    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    return res.render("user/reset_success.ejs");
  } catch (error) {
    if (error.isJoi) {
      return res.render("user/invalid_link.ejs");
    } else {
      return res.render("user/invalid_link.ejs");
    }
  }
};

exports.deleteUser = async (req, res) => {
  // const inputData = await deleteUser.validateAsync(req.params);
  const { userId } = req.body;

  try {
    // Delete user
    const user = await UserModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Delete related data
    await ResultModel.deleteMany({ user_id: userId });
    await TestProgressModel.deleteMany({ user_id: userId });
    await ManagersResult.deleteMany({ user_id: userId });
    await managersTestprogressModel.deleteMany({ user_id: userId });

    res.status(200).send({ message: 'User and related data deleted successfully' });
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
}