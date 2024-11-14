require("dotenv").config();
const ejs = require("ejs");
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");

const { fetchQuestionClient, generateResult, generateManagersResult, getResult, saveTestProgress, saveManagersTestProgress, questionContactUs } = require("../../validator/validator_function");
const QuestionModel = require("../../models/QuestionModel");
const QuestionTestRelation = require("../../models/QuestionTestRelation");
const TestModel = require("../../models/TestModel");
const ResultModel = require("../../models/ResultModel");
const ResultQuestionAnswerModel = require("../../models/ResultQuestionAnswerModel");
const TestProgressModel = require("../../models/TestProgressModel");
const UserModel = require("../../models/UserModel");
const Managers_Result_Question_Answer = require("../../models/ManagersResultAnswer");
const ManagersResult = require("../../models/ManagersResultModel");
var mongoose = require("mongoose");
const SetModel = require("../../models/SetModel");
const PointTransaction = require("../../models/PointTransaction");
const { constants } = require("../../helpers/constants");
const managersTestprogress = require("../../models/managersTestprogress");
const ProjectManagersModel = require("../../models/ProjectManagersQuestions");
const mailer = require("../../helpers/mailer");

exports.getFullQuestionByIds = async (req, res) => {
  try {
    const result = await fetchQuestionClient.validateAsync(req.body);
    var { question_ids, test_id } = result;
    var test = await TestModel.findById(test_id).populate("set_id", "is_paid");
    if (!test) return apiResponse.ErrorResponse(res, "Test Not Found");
    if (test.set_id.is_paid == true) {
      //check For Purchase
      if (!req.user_db.purchased_set.includes(test.set_id._id)) {
        return apiResponse.ErrorResponse(res, "You need to purchase the Set");
      }
      //
    }
    var rel = await QuestionTestRelation.find({
      test_id,
      question_id: { $in: question_ids },
    }).count();
    if (rel != question_ids.length)
      return apiResponse.ErrorResponse(
        res,
        "Test does not have this questions"
      );
    var questions = await QuestionModel.find({
      _id: { $in: question_ids },
    }).select(
      "-correct_answer_id -explanation_in_english -explanation_in_hindi"
    );
    const transformed = questions.reduce((result, doc) => {
      result[doc._id] = doc.toObject();
      return result;
    }, {});

    return apiResponse.successResponseWithData(res, "", transformed);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.generateResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const inputData = await generateResult.validateAsync(req.body);
    var { test_id, question_answer } = inputData;
    if (Object.keys(question_answer).length < 1)
      return apiResponse.ErrorResponse(
        res,
        "Need Atleast One Answer To Generate Result"
      );
    var test = await TestModel.findById(test_id)
      .populate("question_ids")
      .populate("set_id", "is_paid")
      .lean();
    if (!test) return apiResponse.ErrorResponse(res, "Test Not Found");
    if (
      test.set_id.is_paid == true &&
      !req.user_db.purchased_set.includes(test.set_id._id)
    )
      return apiResponse.ErrorResponse(res, "First Purchase the Set");
    var userAnswers = question_answer;
    var questions = test.question_ids;
    var max_marks = 0;
    var total_marks_obtained = 0;
    var detailsResults = [];
    var user_id = req.user_db._id;
    var objId = new mongoose.Types.ObjectId();
    var attemptedReal = 0;
    var wrong_answers_count = 0,
      correct_answers_count = 0,
      total_positive_marks = 0,
      total_negative_marks = 0;
    questions.forEach((question) => {
      max_marks = max_marks + question.marks_per_question;
      if (userAnswers[question._id] == null) {
        detailsResults.push({
          result_id: objId,
          question_id: question._id,
          marks_obtained: 0,
        });
        return;
      }
      var isCorrect = userAnswers[question._id] == question.correct_answer_id;

      if (isCorrect) {
        correct_answers_count += 1;
        total_marks_obtained += question.marks_per_question;
        total_positive_marks += question.marks_per_question;
      } else {
        wrong_answers_count += 1;
        total_marks_obtained -= question.minus_marks_per_question;
        total_negative_marks += question.minus_marks_per_question;
      }
      detailsResults.push({
        result_id: objId,
        question_id: question._id,
        answer_given: userAnswers[question._id],
        marks_obtained: isCorrect
          ? question.marks_per_question
          : question.minus_marks_per_question * -1,
      });
      attemptedReal++;
    });

    //the given question id does not belongs to test
    if (attemptedReal == 0)
      return apiResponse.ErrorResponse(res, "Something is Not Right");

    const resultData = {
      _id: objId,
      test_id,
      user_id,
      total_marks: max_marks,
      marks_obtained: total_marks_obtained,
      attempted_questions_count: attemptedReal,
      not_attempted_questions_count: questions.length - attemptedReal,
      wrong_answers_count,
      correct_answers_count,
      total_positive_marks,
      total_negative_marks,
    };
    var result = await ResultModel.create([resultData], { session });
    result = result[0];
    result = result.toObject();
    result.test_title = test.title;
    await ResultQuestionAnswerModel.insertMany(detailsResults, { session });
    await TestProgressModel.deleteMany(
      { user_id: resultData.user_id, test_id },
      { session }
    ); //jkprogress

    // create point transaction
    if (Number(total_marks_obtained) > 0) {
      const existingTransaction = await PointTransaction.findOne({
        user_id,
        test_id,
      });
      if (!existingTransaction) {
        const transactionData = {
          user_id,
          test_id,
          initial_points: Number(req.user_db.points),
          final_points:
            Number(req.user_db.points) + Number(total_marks_obtained),
          difference: Number(total_marks_obtained),
          action: constants.pointsTransaction.ADD,
          reason: constants.pointsTransactionReason.TEST_ADDONS,
          comment: `${total_marks_obtained} ${constants.pointsTransactionComment.TEST_ADDONS} ${test.title.EN}`,
        };

        await PointTransaction.create([transactionData], { session });
        const updatedPoints =
          Number(req.user_db.points) + Number(total_marks_obtained);
        req.user_db.points = updatedPoints;
      }
    }

    req.user_db.ongoing_tests = req.user_db.ongoing_tests.filter(function (
      item
    ) {
      return item != test_id;
    });
    if (!req.user_db.results.includes(test_id)) {
      req.user_db.results.push(test_id);
    }
    await req.user_db.save({ session });

    await session.commitTransaction();
    return apiResponse.successResponseWithData(res, "result Created", result);
  } catch (error) {
    await session.abortTransaction();
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  } finally {
    session.endSession();
  }
};

// generate Managers Result
exports.generateManagersResult = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log("BODY", req.body);

    //can we check the backend fror already give set
    const inputData = await generateManagersResult.validateAsync(req.body);
    var { data } = inputData;
    console.log("data in generate result", data);
    if (!data.question_answer) {
      console.log("data.question_answer", data.question_answer);
      return apiResponse.ErrorResponse(
        res,
        "Need Atleast One Answer To Generate Result",
        "data.question_answer:",
        data.question_answer
      );
    }
    if (Object.keys(data.question_answer).length < 1)
      return apiResponse.ErrorResponse(
        res,
        "Need Atleast One Answer To Generate Result"
      );

    // var user_data = await UserModel.findById(req.user_db._id);
    // const already_exist_quiz_result_in_userModel =
    //   user_data?.attempted_Set?.find((item) => item.page === data.quiz_number);
    // console.log("**********************************already_exist_quiz_result_in_userModel Start**********************************")
    // console.log("already_exist_quiz_result_in_userModel=========>", already_exist_quiz_result_in_userModel)
    // console.log("**********************************already_exist_quiz_result_in_userModel End************************************")
    // if (already_exist_quiz_result_in_userModel)
    //   return apiResponse.ErrorResponse(
    //     res,
    //     "Quiz Result Already Exists In User Data!"
    //   );

    var userAnswers = data.question_answer;
    var {
      quiz_number,
      progress_total_time,
      attempted_questions_count,
      correct_answers_count,
      marks_obtained,
      not_attempted_questions_count,
      total_marks,
      total_negative_marks,
      total_positive_marks,
      wrong_answers_count,
    } = data;
    var objId = new mongoose.Types.ObjectId();
    const resultData = {
      _id: objId,
      // test_id,
      user_id: req.user_db._id,
      total_marks: total_marks,
      marks_obtained: marks_obtained,
      attempted_questions_count: attempted_questions_count,
      not_attempted_questions_count: not_attempted_questions_count,
      wrong_answers_count,
      correct_answers_count,
      total_positive_marks,
      total_negative_marks,
      quiz_number,
      progress_total_time,
    };

    var result = await ManagersResult.create([resultData], { session });
    try {
      var user = await UserModel.findById(req.user_db._id);
      if (user) {
        if (!user.results || !user.results.length) {
          user.results = [];
        }
        user.results.push(objId);
        user.attempted_Set.push({ page: data.page, resultId: objId });
        await user.save();
        console.log("🚀 ~ exports.generateManagersResult= ~ user:", user);
      } else {
        return apiResponse.ErrorResponse(
          res,
          "user not found for",
          req.user_db._id
        );
      }
    } catch (error) {
      console.log(error);
    }

    result = result[0];
    result = result.toObject();
    let quationsData = [];
    userAnswers.forEach((info) => {
      if (info) {
        quationsData.push({
          result_id: objId,
          question_id: info.question_id,
          answer_given: info.user_answer,
          correct_answer: info.correct_answer,
          marks_obtained: info.marks_obtained,
        });
      }
    });
    await Managers_Result_Question_Answer.insertMany(quationsData, { session });
    // try {
    //   let deleteResult = await managersTestprogress.deleteMany({ user_id: req.user_db._id });

    //   console.log(deleteResult);
    // } catch (error) {
    //   console.log(error);
    // }

    await session.commitTransaction();
    return apiResponse.successResponseWithData(res, "result Created", result);
  } catch (error) {
    await session.abortTransaction();
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  } finally {
    session.endSession();
  }
};

// Get managers result
exports.getManagersResult = async (req, res) => {
  try {
    const inputData = await getResult.validateAsync(req.params);
    var { result_id } = inputData;
    var result = await ManagersResult.findById(result_id)
      .populate("_id")
      .lean();
    if (!result) return apiResponse.ErrorResponse(res, "Result Not Found");
    // result.test_title = result.test_id.title;
    // result.test_id = result.test_id._id;
    // const resultIds = result.map(result => result._id);

    // Fetch related data from Managers_Result_Question_Answer using resultIds
    var question_answers_page = await Managers_Result_Question_Answer.find({
      result_id: { $in: result._id },
    });
    const questionAnswersMap = {};
    if (question_answers_page && question_answers_page.length) {
      question_answers_page.forEach((answer, index) => {
        if (!questionAnswersMap[answer.result_id]) {
          questionAnswersMap[answer.result_id] = [];
        }
        questionAnswersMap[answer.result_id].push(answer);
      });
      result.question_answers = questionAnswersMap[result._id] || [];
      // Add the related data to the corresponding result objects
      // result.forEach(result => {
      // result.question_answers = questionAnswersMap[result._id] || [];
      // });
    }

    return apiResponse.successResponseWithData(res, "", result);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

// get Managers Question Answer list
exports.getManagersQuestionAnswers = async (req, res) => {
  try {
    const inputData = await getResult.validateAsync(req.params);
    var { result_id } = inputData;
    const options = {
      page: req.query.page ?? 1,
      limit: req.query.limit ?? 20,
      sort: "_id",
      lean: { virtuals: true },
      populate: "question_id",
    };

    var question_answers_page = await Managers_Result_Question_Answer.paginate(
      { result_id },
      options
    );
    for (let index = 0; index < question_answers_page.docs.length; index++) {
      if (question_answers_page.docs[index]["question_id"] == null) {
        // delete question_answers_page.docs.splice(index)[index];
        // continue;
      }
      delete Object.assign(question_answers_page.docs[index], {
        ["question_details"]: question_answers_page.docs[index]["question_id"],
      })["question_id"];
    }
    return apiResponse.successResponseWithData(res, "", question_answers_page);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

exports.getResult = async (req, res) => {
  try {
    const inputData = await getResult.validateAsync(req.params);
    var { result_id } = inputData;
    var result = await ResultModel.findById(result_id)
      .populate("test_id", "title")
      .lean();
    if (!result) return apiResponse.ErrorResponse(res, "Result Not Found");
    result.test_title = result.test_id.title;
    result.test_id = result.test_id._id;

    return apiResponse.successResponseWithData(res, "", result);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error);
    }
  }
};

exports.getQuestionAnswers = async (req, res) => {
  try {
    const inputData = await getResult.validateAsync(req.params);
    var { result_id } = inputData;
    const options = {
      page: req.query.page ?? 1,
      limit: req.query.limit ?? 20,
      sort: "_id",
      lean: { virtuals: true },
      populate: "question_id",
    };

    var question_answers_page = await ResultQuestionAnswerModel.paginate(
      { result_id },
      options
    );
    for (let index = 0; index < question_answers_page.docs.length; index++) {
      if (question_answers_page.docs[index]["question_id"] == null) {
        // delete question_answers_page.docs.splice(index)[index];
        // continue;
      }
      delete Object.assign(question_answers_page.docs[index], {
        ["question_details"]: question_answers_page.docs[index]["question_id"],
      })["question_id"];
    }
    return apiResponse.successResponseWithData(res, "", question_answers_page);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

// exports.saveTestProgress = async (req, res) => {
//     try {
//         const val = await saveTestProgress.validateAsync(req.body);
//         const { test_id, at_question_id, total_attempted, question_answer_json_string } = val;
//         await TestProgressModel.findOneAndUpdate({ test_id, user_id: req.user_db._id }, { test_id, at_question_id, total_attempted, question_answer_json_string }, {
//             new: true,
//             upsert: true,
//         })
//         if (!req.user_db.ongoing_tests.includes(test_id)) {
//             req.user_db.ongoing_tests.push(test_id)
//             await req.user_db.save();
//         }
//         return apiResponse.successResponse(res, "Progress Saved")
//     } catch (error) {
//         if (error.isJoi) {
//             apiResponse.validationErrorWithData(res, error.details[0].message, error)
//         } else {
//             console.log(error);
//             apiResponse.ErrorServer(res, error.message);
//         }
//     }
// }

exports.saveTestProgress = async (req, res) => {
  try {
    const val = await saveManagersTestProgress.validateAsync(req.body);
    var {
      at_question_id,
      page_index,
      total_marks,
      marks_obtained,
      attempted_questions_count,
      not_attempted_questions_count,
      wrong_answers_count,
      correct_answers_count,
      total_positive_marks,
      total_negative_marks,
      quiz_number,
      progress_status,
      progress_total_time,
      question_answer,
    } = val.data;

    let quationsData = [];
    question_answer?.forEach((info) => {
      if (info) {
        quationsData.push({
          question_id: info.question_id,
          answer_given: info.user_answer,
          correct_answer: info.correct_answer,
          marks_obtained: info.marks_obtained,
        });
      }
    });

    const resultData = {
      user_id: req.user_db._id,
      quiz_number,
      at_question_id: at_question_id,
      page_index: page_index,
      total_marks: total_marks,
      marks_obtained: marks_obtained,
      attempted_questions_count: attempted_questions_count,
      not_attempted_questions_count: not_attempted_questions_count,
      wrong_answers_count,
      correct_answers_count,
      total_positive_marks,
      total_negative_marks,
      options: quationsData,
      progress_status,
      progress_total_time,
    };

    const Testprogress = await managersTestprogress.create(resultData);
    if (Testprogress) {
      return apiResponse.successResponse(res, "Progress Saved!");
    } else {
      return apiResponse.ErrorResponse(res, "Something Went Wrong!");
    }
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

exports.getTestProgress = async (req, res) => {
  try {
    if (!req.query.quiz_number)
      return apiResponse.ErrorResponse(res, "quiz number is required");
    var progress = await managersTestprogress.findOne({
      user_id: req.user_db._id,
      quiz_number: Number(req.query.quiz_number),
    });
    return apiResponse.successResponseWithData(
      res,
      "Quiz progress get successfully!",
      progress
    );
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};
// exports.retrieveTestProgress = async (req, res) => {
//     try {
//         if (req.params.testId == null) return apiResponse.ErrorResponse(res, "test ID required");
//         var progress = await TestProgressModel.findOne({ user_id: req.user_db._id, test_id: req.params.testId });
//         return apiResponse.successResponseWithData(res, "", progress);
//     } catch (error) {
//         if (error.isJoi) {
//             apiResponse.validationErrorWithData(res, error.details[0].message, error)
//         } else {
//             console.log(error);
//             apiResponse.ErrorServer(res, error.message);
//         }
//     }
// }

exports.getAllOngoingTest = async (req, res) => {
  try {
    if (req.user_db.ongoing_tests.length > 0)
      var tests = await TestModel.find({
        _id: { $in: req.user_db.ongoing_tests },
      }).lean();
    else var tests = [];

    for (let index = 0; index < tests.length; index++) {
      tests[index].question_count = tests[index].question_ids.length;
      tests[index].is_ongoing = true;

      delete tests[index].question_ids;
    }

    return apiResponse.successResponseWithData(res, "", tests);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

// get all managers question result
exports.getAllManagersResults = async (req, res) => {
  try {
    // var results = await ManagersResult.find({ user_id: req.user_db._id }).populate('_id', 'title').sort({ "createdAt": -1 }).lean();
    let id = "6448bdb98aa714711d474f57";
    var results = await ManagersResult.find({ user_id: req.user_db._id })
      .populate("_id")
      .sort({ createdAt: -1 })
      .lean();

    // Extract _id values from the results
    const resultIds = results.map((result) => result._id);

    // Fetch related data from Managers_Result_Question_Answer using resultIds
    var question_answers_page = await Managers_Result_Question_Answer.find({
      result_id: { $in: resultIds },
    });
    const questionAnswersMap = {};
    if (question_answers_page && question_answers_page.length) {
      question_answers_page.forEach((answer) => {
        if (!questionAnswersMap[answer.result_id]) {
          questionAnswersMap[answer.result_id] = [];
        }
        questionAnswersMap[answer.result_id].push(answer);
      });

      // Add the related data to the corresponding result objects
      results.forEach((result) => {
        result.question_answers = questionAnswersMap[result._id] || [];
      });
    }
    // for (let index = 0; index < results.length; index++) {
    //     var test = results[index].test_id;
    //     results[index].test_id = test._id;
    //     results[index].test_title = test.title;
    // }

    return apiResponse.successResponseWithData(res, "", results);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

exports.getAllResults = async (req, res) => {
  try {
    var results = await ResultModel.find({ user_id: req.user_db._id })
      .populate("test_id", "title")
      .sort({ createdAt: -1 })
      .lean();

    for (let index = 0; index < results.length; index++) {
      var test = results[index].test_id;
      results[index].test_id = test._id;
      results[index].test_title = test.title;
    }

    return apiResponse.successResponseWithData(res, "", results);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

exports.getMySets = async (req, res) => {
  try {
    var user = req.user_db;
    var testList = [];
    testList.push(...user.ongoing_tests);
    testList.push(...user.results);
    var setIdArray = [];
    setIdArray.push(...user.purchased_set);
    var testList = await TestModel.find({
      $or: [{ _id: { $in: testList } }, { set_id: { $in: setIdArray } }],
    })
      .select("set_id")
      .lean();
    testList.forEach((test) => {
      setIdArray.push(test.set_id);
    });

    var sets = await SetModel.find({ _id: { $in: setIdArray } }).lean({
      virtuals: true,
    });
    for (let i = 0; i < sets.length; i++) {
      sets[i].already_purchased = user.purchased_set.includes(sets[i]._id);
      delete sets[i]["test_series_ids"];
    }

    return apiResponse.successResponseWithData(res, "", sets);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

exports.getAllQuizlists = async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) || 1 : 1;
    const limit = req.query.limit ? Number(req.query.limit) || 10 : 10;

    const pipeline = [
      {
        $count: "totalCount",
      },
      {
        $addFields: {
          no_of_quiz: {
            $ceil: {
              $divide: ["$totalCount", 10],
            },
          },
        },
      },
      {
        $addFields: {
          quiz_list: {
            $map: {
              input: {
                $range: [
                  1,
                  {
                    $add: ["$no_of_quiz", 1],
                  },
                ],
              },
              as: "number",
              in: {
                quiz_number: "$$number",
                quiz_name: {
                  $concat: [
                    "Quiz ",
                    {
                      $toString: "$$number",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $unwind: "$quiz_list",
      },
      {
        $lookup: {
          from: "managers_test_progresses",
          let: {
            quiz_number: "$quiz_list.quiz_number",
            user_id: req.user_db._id,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$$quiz_number", "$quiz_number"],
                    },
                    {
                      $eq: ["$$user_id", "$user_id"],
                    },
                  ],
                },
              },
            },
            {
              $sort: { createdAt: -1 }, // Sort by createdAt or relevant timestamp in descending order
            },
            {
              $limit: 1, // Limit to the last record
            },
          ],
          as: "quiz_progress_data",
        },
      },
      {
        $lookup: {
          from: "managers_test_progresses",
          let: {
            quiz_number: "$quiz_list.quiz_number",
            user_id: req.user_db._id,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$$quiz_number", "$quiz_number"],
                    },
                    {
                      $eq: ["$$user_id", "$user_id"],
                    },
                  ],
                },
              },
            }
          ],
          as: "quiz_progress_data_count",
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            quiz_number: "$quiz_list.quiz_number",
            user_id: req.user_db._id,
          },
          pipeline: [
            {
              $unwind: "$attempted_Set",
            },
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$$quiz_number", "$attempted_Set.page"],
                    },
                    {
                      $eq: ["$$user_id", "$_id"],
                    },
                  ],
                },
              },
            },
          ],
          as: "result_data",
        },
      },
      {
        $group: {
          _id: null,
          result: {
            $push: {
              quiz_number: "$$ROOT.quiz_list.quiz_number",
              quiz_name: "$$ROOT.quiz_list.quiz_name",
              quiz_progress_data: {
                $ifNull: [
                  {
                    $arrayElemAt: ["$$ROOT.quiz_progress_data", 0],
                  },
                  null,
                ],
              },
              quiz_attempt_count: {
                $size: "$$ROOT.quiz_progress_data_count",
              },
              result_id: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      "$$ROOT.result_data.attempted_Set.resultId",
                      0,
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          New_Docs: {
            $map: {
              input: "$result",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    quiz_percentage: {
                      $cond: {
                        if: {
                          $ne: ["$$this.quiz_progress_data", null],
                        },
                        then: {
                          $multiply: [
                            {
                              $cond: {
                                if: {
                                  $ne: ["$$this.quiz_progress_data", null],
                                },
                                then: {
                                  $sum: "$$this.quiz_progress_data.options.marks_obtained",
                                },
                                else: 0,
                              },
                            },
                            10,
                          ],
                        },
                        else: null,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          docs: {
            $slice: ["$New_Docs", (page - 1) * limit, limit],
          },
        },
      },
    ];
    var [questionList] = await ProjectManagersModel.aggregate(pipeline);

    return apiResponse.successResponseWithData(res, "Quiz list get successfully!", questionList);
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
};

exports.getAllQuizlistsWithoutLogin = async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) || 1 : 1;
    const limit = req.query.limit ? Number(req.query.limit) || 10 : 10;

    const userId = null;

    const pipeline = [
      {
        $count: "totalCount",
      },
      {
        $addFields: {
          no_of_quiz: {
            $ceil: {
              $divide: ["$totalCount", 10],
            },
          },
        },
      },
      {
        $addFields: {
          quiz_list: {
            $map: {
              input: {
                $range: [1, { $add: ["$no_of_quiz", 1] }],
              },
              as: "number",
              in: {
                quiz_number: "$$number",
                quiz_name: { $concat: ["Quiz ", { $toString: "$$number" }] },
              },
            },
          },
        },
      },
      { $unwind: "$quiz_list" },
      {
        $lookup: {
          from: "managers_test_progresses",
          let: { quiz_number: "$quiz_list.quiz_number", user_id: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$quiz_number", "$quiz_number"] },
                    { $eq: ["$$user_id", "$user_id"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "quiz_progress_data",
        },
      },
      {
        $lookup: {
          from: "managers_test_progresses",
          let: { quiz_number: "$quiz_list.quiz_number", user_id: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$quiz_number", "$quiz_number"] },
                    { $eq: ["$$user_id", "$user_id"] },
                  ],
                },
              },
            },
          ],
          as: "quiz_progress_data_count",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { quiz_number: "$quiz_list.quiz_number", user_id: userId },
          pipeline: [
            { $unwind: "$attempted_Set" },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$quiz_number", "$attempted_Set.page"] },
                    { $eq: ["$$user_id", "$_id"] },
                  ],
                },
              },
            },
          ],
          as: "result_data",
        },
      },
      {
        $group: {
          _id: null,
          result: {
            $push: {
              quiz_number: "$$ROOT.quiz_list.quiz_number",
              quiz_name: "$$ROOT.quiz_list.quiz_name",
              quiz_progress_data: {
                $ifNull: [{ $arrayElemAt: ["$$ROOT.quiz_progress_data", 0] }, null],
              },
              quiz_attempt_count: { $size: "$$ROOT.quiz_progress_data_count" },
              result_id: {
                $ifNull: [{ $arrayElemAt: ["$$ROOT.result_data.attempted_Set.resultId", 0] }, null],
              },
            },
          },
        },
      },
      {
        $addFields: {
          New_Docs: {
            $map: {
              input: "$result",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    quiz_percentage: {
                      $cond: {
                        if: { $ne: ["$$this.quiz_progress_data", null] },
                        then: {
                          $multiply: [
                            {
                              $sum: {
                                $ifNull: ["$$this.quiz_progress_data.options.marks_obtained", 0],
                              },
                            },
                            10,
                          ],
                        },
                        else: null,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          docs: { $slice: ["$New_Docs", (page - 1) * limit, limit] },
        },
      },
    ];

    const [questionList] = await ProjectManagersModel.aggregate(pipeline);

    return apiResponse.successResponseWithData(res, "Quiz list retrieved successfully!", questionList);
  } catch (error) {
    if (error.isJoi) {
      return apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      return apiResponse.ErrorServer(res, error.message);
    }
  }
};


exports.resetQuiz = async (req, res) => {
  const { user_id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const testProgressDeleteResult = await managersTestprogress.deleteMany({ user_id }).session(session);

    const resultDeleteResult = await ManagersResult.find({ user_id }).session(session);
    const resultIds = resultDeleteResult.map((result) => result._id);

    const questionAnswerDeleteResult = await Managers_Result_Question_Answer.deleteMany({
      result_id: { $in: resultIds },
    }).session(session);

    const managersResultDeleteResult = await ManagersResult.deleteMany({ user_id }).session(session);

    const userUpdateResult = await UserModel.updateOne(
      { _id: user_id },
      { $set: { results: [], attempted_Set: [] } }
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Records deleted successfully",
      testProgressDeleteResult,
      managersResultDeleteResult,
      questionAnswerDeleteResult,
      userUpdateResult
    });
  } catch (error) {
    await session.abortTransaction();
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  } finally {
    session.endSession();
  }
};

exports.questionContactUs = async (req, res) => {
  const user = req.user_db;
  try {
    const { description } = await questionContactUs.validateAsync(req.body);
    var html = await ejs.renderFile(
      `${process.cwd()}/views/email_tamplate/contact_us.ejs`,
      {
        name: "user.name",
        email: "user.email",
        description,
        logo_url: `${process.env.APP_DOMAIN}/logo.png`,
      }
    );
    await mailer.send(
      process.env.EMAIL_FROM,
      "silhouette2020@yopmail.com",
      `Contact Us`,
      html
    );
    return apiResponse.successResponseWithData(res, "Sent!");
  } catch (error) {
    if (error.isJoi) {
      apiResponse.validationErrorWithData(res, error.details[0].message, error);
    } else {
      console.log(error);
      apiResponse.ErrorServer(res, error.message);
    }
  }
}
