const readXlsxFile = require('read-excel-file/node')
const SetModel = require("../models/SetModel");
const SubjectModel = require("../models/SubjectModel");


module.exports = async (filePath) => {
    try {
        var rows = await readXlsxFile(filePath, { sheet: 1 });

        var Question = rows[0][1];
        var setID = rows[0][1];
        var testTitleEnglish = rows[1][1];
        var testTitleHindi = rows[2][1];
        var subjectId = rows[3][1];
        // if (setID == null) throw "Set ID Cannot be Blank";
        // if (testTitleEnglish == null) throw "Test title in English Cannot be Blank";
        // if (testTitleHindi == null) throw "Test title in Hindi Cannot be Blank";
        var randomId = Math.floor(1000 + Math.random() * 9000);
        var testMetaDeta = { title: { "EN": testTitleEnglish + " #" + randomId} ,filename:{"name":filePath}};

        // var setIdVaild = await SetModel.findById(setID).populate('subject_id').catch((e) => { throw "Invalid Set ID is  Given"; });
        // if (setIdVaild == null) throw "Invalid Set ID is Given";
        // if (setIdVaild.subject_id != null && subjectId == null) throw "Please Give a Proper Subject ID because Set type is SUBJECT";
        // if (setIdVaild.subject_id != null && subjectId != setIdVaild.subject_id.number_id) throw "Subject Id Given is Not Matching With Set's Subject";




        // var allSubjects = await SubjectModel.find()
        // var validSubjectIds = allSubjects.map(subject => subject.number_id);
        // var subjectNumToId = {};
        // allSubjects.forEach((sub) => {
        //     subjectNumToId[sub.number_id] = sub._id
        // })






        // if (subjectId != null) {
        //     if (!validSubjectIds.includes(subjectId)) {
        //         throw "Invalid Subject ID is Given";
        //     }
        // }

        // rows = await readXlsxFile(filePath, { sheet: 2 });
        // if (rows.length < 1000) throw "At least 1000 Question should be provided"; //pmplimit

        var questionsArray = [];
        for (var i = 1; i < rows.length; i++) {
            let questionRow = rows[i];
            let [question_in_english,Option_A, Option_B,Option_C,Option_D,correct_option, explanation_in_english] = [questionRow[1], questionRow[2], questionRow[3], questionRow[4], questionRow[5], questionRow[6],questionRow[7]]
            if (question_in_english == null) throw "QUESTION IN ENGLISH is blank in Question Number - " + i;
            if (Option_A == null) throw "QUESTION Option A is blank in Question Number - " + i;
            if (Option_B == null) throw "QUESTION Option B is blank in Question Number - " + i;
            if (Option_C == null) throw "QUESTION Option C is blank in Question Number - " + i;
            if (Option_D == null) throw "QUESTION Option D is blank in Question Number - " + i;
            if (correct_option == null) throw "CORRECT ANSWER(A-E) is blank in Question Number - " + i;
            if (explanation_in_english == null) throw "explanation(ENGLISH) is blank in Question Number - " + i;
            // if (explanation_in_hindi == null) throw "explanation(HINDI) is blank in Question Number - " + i;
            // if (testMetaDeta.subjectId != null) subjectId = testMetaDeta.subjectId;
            // if (subjectId == null) throw "Subject ID Required in Question Number - " + i;
            // if (validSubjectIds.includes(subjectId) == false) throw "Subject ID of Question Number - " + i + " is Invalid ";


            let options = [];
            if (questionRow[2] == null) throw "Please Provide OPTION A (ENGLISH) for Question Number - " + i;
            if (questionRow[7] == null) throw "Please Provide OPTION ANSWER  for Question Number - " + i;


            for (var g = 2; g < 7; g++) {
                var option
                if (questionRow[g] == null) continue;
                // if (questionRow[g + 5] == null) { console.log("THROWING ERROR"); throw `Please Provide HINDI option also for Question Number ${i} Option Number ${g}` };
                if (g == 2)
                {
                    option = { id: "A", text: { EN: questionRow[g]
                        // , HI: questionRow[g + 5]
                    } };
                    options.push(option)
                }
                if (g == 3)
                {
                    option = { id: "B", text: { EN: questionRow[g]
                        // , HI: questionRow[g + 5] 
                    } };
                    options.push(option)
                }
                if (g == 4)
                {
                    option = { id: "C", text: { EN: questionRow[g]
                        // , HI: questionRow[g + 5]
                    } };
                    options.push(option)
                }
                if (g == 5)
                {
                    option = { id: "D", text: { EN: questionRow[g]
                        // , HI: questionRow[g + 5]
                    } } ;
                    options.push(option)
                }
            //     if (g == 6)
            //          option = { id: "E", text: { EN: questionRow[g]
            //     // , HI: questionRow[g + 5] 
            // } };
                // options.push(option)
            }
            questionsArray.push({ text: { "EN": question_in_english, }, options, correct_answer_id: correct_option, explanation_in_english, })

        }

        return { testMetaDeta, questionsArray };

    } catch (error) {
        console.log(error);
        throw error;
    }

}