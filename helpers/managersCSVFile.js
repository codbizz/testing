const readXlsxFile = require('read-excel-file/node')
const SetModel = require("../models/SetModel");
const SubjectModel = require("../models/SubjectModel");
const option_imgsModel = require("../models/option_imgs");
// const parse = require('csv-parse');
const csv = require('csvtojson');
var fs = require('fs');
module.exports = async (filePath) => {
    try {
        const res = await csv().fromFile(filePath);
        console.log(res);
        let rows = res;

        // var rows = await parse(filePath, { sheet: 1 });

        var Question = rows[0][1];
        var setID = rows[0][1];
        let questionRow = Object.values(rows[1]);
        var testTitleEnglish = questionRow[1];
        var testTitleHindi = rows[2][1];
        var subjectId = rows[3][1];
        // if (setID == null) throw "Set ID Cannot be Blank";
        // if (testTitleEnglish == null) throw "Test title in English Cannot be Blank";
        // if (testTitleHindi == null) throw "Test title in Hindi Cannot be Blank";
        var randomId = Math.floor(1000 + Math.random() * 9000);
        var testMetaDeta = { title: { "EN": testTitleEnglish + " #" + randomId }, filename: { "name": filePath } };
        if (rows.length > 1000) throw "Questions are more than 1000";
        // if (rows.length < 1000  && rows.length != 1000) throw "At least 1000 Question should be provided";  //pm2limit
        const sNoSet = new Set();
        var questionsArray = [];
        const imgIds = [];

        for (var i = 0; i < rows.length; i++) {
            if (rows[i].s_no) {
                if (sNoSet.has(rows[i].s_no)) {
                    throw `Duplicate s_no detected: ${rows[i].s_no}`;
                }
                sNoSet.add(rows[i].s_no);
            } else {
                throw `s_no not found : ${rows[i].s_no} for ${i}`;
            }


            let questionRow = rows[i];
            let option_A_image_id = questionRow.option_A_image_id
            let option_B_image_id = questionRow.option_B_image_id
            let option_C_image_id = questionRow.option_C_image_id
            let option_D_image_id = questionRow.option_D_image_id
            let questionRow1 = rows[i].question_in_English;
            // questionRow  = Object.values(questionRow);
            // let [question_in_english,Option_A, Option_B,Option_C,Option_D,correct_option, explanation_in_english] = [questionRow[1], questionRow[2], questionRow[3], questionRow[4], questionRow[5], questionRow[6],questionRow[7]]
            let [question_in_english, correct_option, explanation_in_english, s_no] = [questionRow.question_in_English, questionRow.Correct_Answers, questionRow.explanation, questionRow.s_no]
            let [Option_A, Option_B, Option_C, Option_D] = [questionRow.option_A_text, questionRow.option_B_text, questionRow.option_C_text, questionRow.option_D_text]
            if (questionRow) {
                if (question_in_english == null) throw "QUESTION IN ENGLISH is blank in Question Number - " + i;
                if (Option_A == null) throw "QUESTION Option A is blank in Question Number - " + i;
                if (Option_B == null) throw "QUESTION Option B is blank in Question Number - " + i;
                if (Option_C == null) throw "QUESTION Option C is blank in Question Number - " + i;
                if (Option_D == null) throw "QUESTION Option D is blank in Question Number - " + i;
                if (correct_option == null) throw "CORRECT ANSWER(A-E) is blank in Question Number - " + i;
                if (explanation_in_english == null) throw "explanation(ENGLISH) is blank in Question Number - " + i;

                let options = [];
                // let questionRowdata  = Object.values(questionRow);
                let questionRowdata = questionRow

                var option
                if (questionRowdata.option_A_text) {
                    option = {
                        id: "A", text: {
                            EN: questionRowdata.option_A_text
                            // , HI: questionRow[g + 5]
                        }
                    };
                    //  if(questionRowdata.option_A_have_image && questionRowdata.option_A_have_image.toLowerCase()=="yes")
                    if (questionRowdata.option_A_image_id && questionRowdata.option_A_image_id.length > 0) {
                        option.text.img = questionRowdata.option_A_image_id
                        imgIds.push(option_A_image_id)
                        try {
                            const singleTestData = await option_imgsModel.findOne({ _id: questionRowdata.option_A_image_id });
                            console.log(singleTestData);
                            if (singleTestData && singleTestData.filename) {
                                option.text.imgurl = singleTestData.filename
                            } else {
                                throw `img id not found for row no ${i} and option A invalid imgid -: ${questionRowdata.option_A_image_id} `;
                            }
                        } catch (error) {
                            console.log(error);
                        }

                    }
                    options.push(option)
                }
                if (questionRowdata.option_B_text) {
                    option = {
                        id: "B", text: {
                            EN: questionRowdata.option_B_text
                            // , HI: questionRow[g + 5] 
                        }
                    };
                    //  if(questionRowdata.option_B_have_image && questionRowdata.option_B_have_image.toLowerCase()=="yes")
                    if (questionRowdata.option_B_image_id && questionRowdata.option_B_image_id.length > 0) {
                        option.text.img = questionRowdata.option_B_image_id
                        imgIds.push(option_B_image_id)
                        try {
                            const singleTestData = await option_imgsModel.findOne({ _id: questionRowdata.option_B_image_id });
                            console.log(singleTestData);
                            if (singleTestData && singleTestData.filename) {
                                option.text.imgurl = singleTestData.filename
                            } else {
                                throw `img id not found for row no ${i} and option B invalid imgid -: ${questionRowdata.option_B_image_id} `;
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                    options.push(option)
                }
                if (questionRowdata.option_C_text) {
                    option = {
                        id: "C", text: {
                            EN: questionRowdata.option_C_text
                            // , HI: questionRow[g + 5]
                        }
                    };
                    if (questionRowdata.option_C_image_id && questionRowdata.option_C_image_id.length > 0) {
                        option.text.img = questionRowdata.option_C_image_id
                        imgIds.push(option_C_image_id)
                        try {
                            const singleTestData = await option_imgsModel.findOne({ _id: questionRowdata.option_C_image_id });
                            console.log(singleTestData);
                            if (singleTestData && singleTestData.filename) {
                                option.text.imgurl = singleTestData.filename
                            } else {
                                throw `img id not found for row no ${i} and option C invalid imgid -: ${questionRowdata.option_C_image_id} `;
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                    options.push(option)
                }
                if (questionRowdata.option_D_text) {
                    option = {
                        id: "D", text: {
                            EN: questionRowdata.option_D_text
                            // , HI: questionRow[g + 5]
                        }
                    };
                    if (questionRowdata.option_D_image_id && questionRowdata.option_D_image_id.length > 0) {
                        option.text.img = questionRowdata.option_D_image_id
                        imgIds.push(option_D_image_id)
                        try {
                            const singleTestData = await option_imgsModel.findOne({ _id: questionRowdata.option_D_image_id });
                            console.log(singleTestData);
                            if (singleTestData && singleTestData.filename) {
                                option.text.imgurl = singleTestData.filename
                            } else {
                                throw `img id not found for row no ${i} and option D invalid imgid -: ${questionRowdata.option_D_image_id} `;
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                    options.push(option)
                }
                questionsArray.push({ s_no: s_no, text: { "EN": question_in_english, }, options, correct_answer_id: correct_option, explanation_in_english, })
            }

        }

        return { testMetaDeta, questionsArray, imgIds };

    } catch (error) {
        console.log(error);
        throw error;
    }

}