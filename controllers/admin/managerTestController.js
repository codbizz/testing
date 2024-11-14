require("dotenv").config();
var mongoose = require("mongoose");
var fs = require('fs');
const QuestionModel = require("../../models/QuestionModel");
const ProjectManagersModel = require("../../models/ProjectManagersQuestions");
const UserModel = require("../../models/UserModel")
const TestModel = require("../../models/TestModel");
const managersTestModel = require("../../models/managersTestModel");
const option_imgsModel = require("../../models/option_imgs");
const { constants } = require('../../helpers/constants')
//helper file to prepare responses.
const apiResponse = require("../../helpers/apiResponse");
const deleteHelper = require("../../helpers/deleteHelper");
const { updateManagerQuestion, createManagerQuestion, createQuestion } = require("../../validator/validator_function");
const { updateTest, removeQuestion } = require("../../validator/validator_function");
const SubjectModel = require("../../models/SubjectModel");
const FileToJson = require("../../helpers/managersExcelFile")
const CSVToJson = require("../../helpers/managersCSVFile")
const path = require('path');
const { Base64_File_Upload_And_Save_Into_Database, uploadImageToS3, File_Upload_In_S3 } = require("../../helpers/aws_S3");

async function saveFilesAndPaths(dataArray) {
    let temp = [];
    for (const item of dataArray) {
        item.error = [];
        if (item.question_image && item.question_image !== "NA") {
            const Saved_Question_Image = await Base64_File_Upload_And_Save_Into_Database(item.question_image, "Question Image", item);
            if (typeof Saved_Question_Image === "object") {
                item.error.push(Saved_Question_Image);
                item.question_image = null;
            } else {
                item.question_image = Saved_Question_Image;
            }
        }
        if (item.option_a_image && item.option_a_image !== "NA") {
            const Saved_Option_A_Image = await Base64_File_Upload_And_Save_Into_Database(item.option_a_image, "Option A Image", item);
            if (typeof Saved_Option_A_Image === "object") {
                item.error.push(Saved_Option_A_Image);
                item.option_a_image = null;
            } else {
                item.option_a_image = Saved_Option_A_Image;
            }
        }
        if (item.option_b_image && item.option_b_image !== "NA") {
            const Saved_Option_B_Image = await Base64_File_Upload_And_Save_Into_Database(item.option_b_image, "Option B Image", item);
            if (typeof Saved_Option_B_Image === "object") {
                item.error.push(Saved_Option_B_Image);
                item.option_b_image = null;
            } else {
                item.option_b_image = Saved_Option_B_Image;
            }
        }
        if (item.option_c_image && item.option_c_image !== "NA") {
            const Saved_Option_C_Image = await Base64_File_Upload_And_Save_Into_Database(item.option_c_image, "Option C Image", item);
            if (typeof Saved_Option_C_Image === "object") {
                item.error.push(Saved_Option_C_Image);
                item.option_c_image = null;
            } else {
                item.option_c_image = Saved_Option_C_Image;
            }
        }
        if (item.option_d_image && item.option_d_image !== "NA") {
            const Saved_Option_D_Image = await Base64_File_Upload_And_Save_Into_Database(item.option_d_image, "Option D Image", item);
            if (typeof Saved_Option_D_Image === "object") {
                item.error.push(Saved_Option_D_Image);
                item.option_d_image = null;
            } else {
                item.option_d_image = Saved_Option_D_Image;
            }
        }
        if (item.explanation_image && item.explanation_image !== "NA") {
            const Saved_Explanation_Image = await Base64_File_Upload_And_Save_Into_Database(item.explanation_image, "Explanation Image", item);
            if (typeof Saved_Explanation_Image === "object") {
                item.error.push(Saved_Explanation_Image);
                item.explanation_image = null;
            } else {
                item.explanation_image = Saved_Explanation_Image;
            }
        }

        temp.push(item);
    }
    return temp;
}

async function CovertDatatoModelData(data_array) {
    try {
        var questionsArray = [];

        for (const item of data_array) {
            let options = [];
            var option;
            if (item.option_a) {
                option = {
                    id: "A",
                    text: { EN: item.option_a },
                    image_url: (item.option_a_image && item.option_a_image !== "NA") ? item.option_a_image : null,
                };
                options.push(option);
            }
            if (item.option_b) {
                option = {
                    id: "B",
                    text: { EN: item.option_b },
                    image_url: (item.option_b_image && item.option_b_image !== "NA") ? item.option_b_image : null,
                };
                options.push(option);
            }
            if (item.option_c) {
                option = {
                    id: "C",
                    text: { EN: item.option_c },
                    image_url: (item.option_c_image && item.option_c_image !== "NA") ? item.option_c_image : null,
                };
                options.push(option);
            }
            if (item.option_d) {
                option = {
                    id: "D",
                    text: { EN: item.option_d },
                    image_url: (item.option_d_image && item.option_d_image !== "NA") ? item.option_d_image : null,
                };
                options.push(option);
            }
            questionsArray.push({
                s_no: Number(item?.question_index) ?? 0,
                text: { "EN": item.question_text },
                question_image: (item.question_image && item.question_image !== "NA") ? item.question_image : null,
                options,
                correct_answer_id: item.answer,
                explanation_in_english: item.explanation,
                explanation_image: (item.explanation_image && item.explanation_image !== "NA") ? item.explanation_image : null,
                is_error: item.error?.length > 0 ? true : false,
                error: item.error,
            });
        }

        return questionsArray;

    } catch (error) {
        console.log(error);
        throw error;
    }
}

exports.createManagerTestSeries = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        //File to json
        const json_data = req.body?.csv_to_json;
        const csv_data = json_data?.filter((item) => item.question_index && item.question_text && item.question_image && item.option_a && item.option_a_image && item.option_b && item.option_b_image && item.option_c && item.option_c_image && item.option_d && item.option_d_image && item.answer && item.explanation && item.explanation_image);
        if (csv_data?.length <= 0) {
            throw new Error('There is no proper data for the question or some fields are missing.');
        }
        const SavedArray = await saveFilesAndPaths(csv_data);
        const data = await CovertDatatoModelData(SavedArray);

        var result_responses = await ProjectManagersModel.insertMany(data, { session });

        console.log("Test Series Created");
        await session.commitTransaction();

        return res.status(200).send({ data: result_responses, msg: `CVG file uploaded successfully` });

    } catch (error) {
        await session.abortTransaction();
        console.log("error while creating new test series")
        console.log(error)
        // return res.render('admin/test_series/upload_managers_upload_screen.ejs', { user: req.user, error: error });
        return res.status(400).send({ msg: error });
    } finally {
        // Ending the session and Deleting the Excel File
        // fs.unlink(req.file.path, () => { });
        session.endSession();
    }
}
// Upload option img
exports.uploadManagerOptionImg = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const fileContent = fs.readFileSync(req.file.path);
        const title = req.body.image_title;
        const s3Url = await uploadImageToS3(`${Date.now()}_${req.file.originalname}`, fileContent, req.file.mimetype);        // // let title ='MY IMG'
        const newOptionImg = new option_imgsModel({
            title: title,
            filename: s3Url,
            active: true
        });

        // Save the new document to the database
        const savedOptionImg = await newOptionImg.save();

        if (savedOptionImg) {
            fs.unlink(req.file.path, () => { });
        }

        // Access the _id from the saved document
        const savedId = savedOptionImg._id;

        console.log('Document saved successfully:', savedId);
        return res.render('admin/test_series/upload_option_img.ejs', { user: req.user, msg: `Image Uploaded copy the img id for use in options ${savedId} ` });

        //    return apiResponse.redirectWithFlashMsg(res, "Created", 'set');

        // return apiResponse.redirectWithFlashMsg(req, res, "/admin/set-detail/" + 'set_id', "Test Series And Questions Uploaded Success");


    } catch (error) {
        await session.abortTransaction();
        console.log("error while creating new test series")
        console.log(error)
        fs.unlink(req.file.path, () => { });
        return res.render('admin/test_series/upload_option_img.ejs', { user: req.user, error: error });
    } finally {
        // Ending the session and Deleting the Excel File
        // fs.unlink(req.file.path, () => { });
        session.endSession();
    }
}
// quations list 
exports.ManagersviewQuestionsListPaginated = async (req, res) => {
    try {
        const options = {
            page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
            limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
            sort: { 'createdAt': -1 },
            lean: { virtuals: true }
        };
        console.log("Query : ", req.query);
        var filter = {};
        if(req.query.is_error && req.query.is_error == "true"){
            filter.is_error = true;
        } 
        req.query.subject_id ? filter.subject_id = req.query.subject_id : "";
        req.query.question_text ? filter['text.EN'] = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
       
        var questionList = await ProjectManagersModel.paginate(filter, options);

        return res.render('admin/question/managers_question_list_paginated.ejs', { user: req.user, questionDetailsPaginated: questionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });

    } catch (error) {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
    }
},

    exports.downloadcsvfile = async (req, res) => {
        try {
            const TestData = await managersTestModel.find();
            if (TestData && TestData.length) {
                let filter
                let newFilename = [];
                if (TestData && TestData[0].filename && TestData[0].filename.name) {
                    console.log("../../" + TestData[0].filename);
                    // if (!fs.existsSync(TestData[0].filename.name)) {
                    //     throw new Error('CSV file not found');
                    //   }
                    const fileStream = fs.createReadStream(TestData[0].filename.name);

                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename=data.csv');

                    fileStream.pipe(res);
                }

            }

        } catch (error) {
            console.log(error);
            return res.render('admin/test_series/upload_managers_upload_screen.ejs', { user: req.user, error: error });
        }
    },

    exports.newcsvformat = async (req, res) => {
        try {

            // if (!fs.existsSync('uploads\\newcsvformat.csv')) {
            //     throw new Error('CSV file not found');
            //   }
            console.log('newcsvformat api called')
            const fileStream = fs.createReadStream(constants.exampleFile.linuxfileAddress); //jk11

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=data.csv');

            fileStream.pipe(res);


        } catch (error) {
            console.log(error);
            return res.render('admin/test_series/upload_managers_upload_screen.ejs', { user: req.user, error: error });
        }
    },

    exports.viewOptionsImgList = async (req, res) => {
        try {
            const options = {
                page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
                limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
                sort: '-updatedAt',
                lean: { virtuals: true }
            };
            var filter = {}
            req.query.subject_id ? filter.subject_id = req.query.subject_id : "";
            req.query.question_text ? filter['title'] = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
            // var subjects = await SubjectModel.find();
            // var subjectStrings = {};
            // subjects.forEach((sub) => {
            //     subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
            // })
            var questionList = await option_imgsModel.paginate(filter, options);
            // return res.json({
            //     user: req.user,
            //     questionDetailsPaginated: questionList,
            //     myvalue: req.query,
            //     error: req.flash('error'),
            //     msg: req.flash('msg')
            //   });
            // return res.render('admin/question/view-options-imglist.ejs', { user: req.user });
            return res.render('admin/question/view-options-imglist.ejs', { user: req.user, questionDetailsPaginated: questionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });

        } catch (error) {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
        }
    }

exports.updateQuestionScreen = async (req, res) => {
    try {
        var questionDetails = await ProjectManagersModel.findById(req.params._id);
        // .populate('subject_id');
        if (questionDetails == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Question Not Found");
        // var subjectList = await SubjectModel.find();

        // const question_image = await option_imgsModel.findById(questionDetails?.question_image);
        // questionDetails.question_image = question_image?.filename;

        // const updatedOptionsPromises = questionDetails.options.map(async (option) => {
        //     if (option?.text?.img) {
        //         const optionImage = await option_imgsModel.findById(option?.text?.img).exec();
        //         return { ...option, text: { ...option.text, img: optionImage?.filename } };
        //     } else {
        //         return option;
        //     }
        // });

        // let options = [];

        // for (let i = 0; i < questionDetails?.options?.length; i++) {
        //     const optionImage = await option_imgsModel.findById(option?.text?.img);
        //     questionDetails?.options[i].text?.img = optionImage;
        //     options.push({})
        // }

        // const explanation_image = await option_imgsModel.findById(questionDetails?.explanation_image);
        // questionDetails.explanation_image = explanation_image?.filename;


        // console.log("options", questionDetails?.options);
        // console.log("questionDetails", questionDetails);

        return res.render('admin/question/update_managers_question_screen.ejs', { user: req.user, questionDetails, error: req.flash('error'), msg: req.flash('msg') });
    } catch (error) {
        console.log(error);
        if (error.isJoi) {
            return apiResponse.redirectWithFlashError(req, res, req.get("Refferer"), error.details[0].message);
        } else {
            return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
        }
    }
}
exports.deleteselectedImg = async (req, res) => {
    try {
        let optiondetails = await option_imgsModel.findByIdAndDelete(req.params._id);
        // var optiondetails = await option_imgsModel.findById(req.params._id)
        // .populate('subject_id');
        if (optiondetails == null) return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Question Not Found");
        if (optiondetails) {
            console.log('optiondetails', optiondetails);
            const options = {
                page: (req.query.page == null || req.query.page == "") ? 1 : req.query.page,
                limit: (req.query.limit == null || req.query.limit == "") ? 10 : req.query.limit,
                sort: '-updatedAt',
                lean: { virtuals: true }
            };
            var filter = {}
            req.query.subject_id ? filter.subject_id = req.query.subject_id : "";
            req.query.question_text ? filter['text.EN'] = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
            // var subjects = await SubjectModel.find();
            // var subjectStrings = {};
            // subjects.forEach((sub) => {
            //     subjectStrings[sub._id] = `${sub.name}(${sub.number_id})`;
            // })
            var questionList = await option_imgsModel.paginate(filter, options);
            return res.render('admin/question/view-options-imglist.ejs', { user: req.user, questionDetailsPaginated: questionList, myvalue: req.query, error: req.flash('error'), msg: req.flash('msg') });

        }
        // var subjectList = await SubjectModel.find();
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
//Update Question Post[Json API]
exports.updateManagerQuestion = async (req, res) => {
    try {

        if (req?.files?.question_image) {
            const file = req.files.question_image[0];
            const question_image = await File_Upload_In_S3(file);
            if(question_image){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            req.body.question_image = question_image;
        }
        if (req?.files?.explanation_image) {
            const file = req.files.explanation_image[0];
            const explanation_image = await File_Upload_In_S3(file);
            if(explanation_image){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            req.body.explanation_image = explanation_image;
        }
        if (req?.files['options[0][image_url]']) {
            const file = req.files['options[0][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'A') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }
        if (req?.files['options[1][image_url]']) {
            const file = req.files['options[1][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'B') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }
        if (req?.files['options[2][image_url]']) {
            const file = req.files['options[2][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'C') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }
        if (req?.files['options[3][image_url]']) {
            const file = req.files['options[3][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'D') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }

        // Check here if image url is alredy exist in db
        async function IsNewOrExistingImageInDb(result) {
            const db_question_records = await await ProjectManagersModel.findById(result?.question_id);

            if ((!db_question_records.explanation_image) && (result.explanation_image == "null")) {
                result.explanation_image = null;
            } else if ((db_question_records.explanation_image) && (result.explanation_image === "null")) {
                result.explanation_image = db_question_records.explanation_image;
            }

            if ((!db_question_records.question_image) && (result.question_image == "null")) {
                result.question_image = null;
            } else if ((db_question_records.question_image) && (result.question_image === "null")) {
                result.question_image = db_question_records.question_image;
            }

            const options = result?.options?.map((option) => {
                if ((!db_question_records.options.find(item => item?.id === option.id).image_url) && (result.options.find(item => item?.id === option.id).image_url === "null")) {
                    option.image_url = null;
                } else if ((db_question_records.options.find(item => item?.id === option.id).image_url) && (result.options.find(item => item?.id === option.id).image_url === "null")) {
                    option.image_url = db_question_records.options.find(item => item?.id === option.id).image_url;
                }
                return option;

            });
            result.options = options;

            return result;
        }

        const final_request_body = await IsNewOrExistingImageInDb(req.body);

        const result = await updateManagerQuestion.validateAsync(final_request_body);

        const { question_id, question_in_english, correct_option, explanation_in_english, options, explanation_image, question_image, is_error } = result;

        await ProjectManagersModel.findByIdAndUpdate(question_id, {
            text: { EN: question_in_english },
            correct_answer_id: correct_option,
            explanation_in_english,
            options,
            explanation_image,
            question_image,
            ...(is_error === "true" ? { is_error: false } : {})
        });
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

        return res.render('admin/question/addNewManagersQuestion.ejs', { user: req.user, testId, subjectList, error: req.flash('error'), msg: req.flash('msg') });

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
        if (req?.files?.question_image) {
            const file = req.files.question_image[0];
            const question_image = await File_Upload_In_S3(file);
            if(question_image){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            req.body.question_image = question_image;
        }
        if (req?.files?.explanation_image) {
            const file = req.files.explanation_image[0];
            const explanation_image = await File_Upload_In_S3(file);
            if(explanation_image){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            req.body.explanation_image = explanation_image;
        }
        if (req?.files['options[0][image_url]']) {
            const file = req.files['options[0][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'A') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }
        if (req?.files['options[1][image_url]']) {
            const file = req.files['options[1][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'B') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }
        if (req?.files['options[2][image_url]']) {
            const file = req.files['options[2][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'C') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }
        if (req?.files['options[3][image_url]']) {
            const file = req.files['options[3][image_url]'][0];
            const image_url = await File_Upload_In_S3(file);
            if(image_url){
                fs.unlink(file.path, (err) => {
                    if (err) {
                      console.error(`Error removing file: ${err}`);
                    }
                    console.log('File removed successfully');
                });
            }
            const options = req.body?.options?.map((option) => {
                if (option?.id === 'D') {
                    return { ...option, image_url: image_url };
                } else {
                    return { ...option };
                }
            });
            req.body.options = options;
        }

        const result = await createManagerQuestion.validateAsync(req.body);
        const { question_in_english, correct_option, explanation_in_english, options, explanation_image, question_image } = result;

        var question = new ProjectManagersModel({
            text: { EN: question_in_english },
            correct_answer_id: correct_option,
            explanation_in_english,
            options,
            explanation_image,
            question_image
        });

        await question.save();
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