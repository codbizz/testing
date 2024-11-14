const readXlsxFile = require('read-excel-file/node')
const SetModel = require("../models/SetModel");
const SubjectModel = require("../models/SubjectModel");


module.exports = async (filePath) => {
    try {
        var rows = await readXlsxFile(filePath, { sheet: 1 });

        var setID = rows[0][1];
        var testTitleEnglish = rows[1][1];
        var testTitleHindi = rows[2][1];
        var subjectId = rows[3][1];
        if (setID == null) throw "Set ID Cannot be Blank";
        if (testTitleEnglish == null) throw "Test title in English Cannot be Blank";
        if (testTitleHindi == null) throw "Test title in Hindi Cannot be Blank";
        var randomId = Math.floor(1000 + Math.random() * 9000);
        var testMetaDeta = { title: { "EN": testTitleEnglish + " #" + randomId, "HI": testTitleHindi + " #" + randomId }, set_id: setID, subjectId };

        var setIdVaild = await SetModel.findById(setID).populate('subject_id').catch((e) => { throw "Invalid Set ID is  Given"; });
        if (setIdVaild == null) throw "Invalid Set ID is Given";
        if (setIdVaild.subject_id != null && subjectId == null) throw "Please Give a Proper Subject ID because Set type is SUBJECT";
        if (setIdVaild.subject_id != null && subjectId != setIdVaild.subject_id.number_id) throw "Subject Id Given is Not Matching With Set's Subject";




        var allSubjects = await SubjectModel.find()
        var validSubjectIds = allSubjects.map(subject => subject.number_id);
        var subjectNumToId = {};
        allSubjects.forEach((sub) => {
            subjectNumToId[sub.number_id] = sub._id
        })






        if (subjectId != null) {
            if (!validSubjectIds.includes(subjectId)) {
                throw "Invalid Subject ID is Given";
            }
        }

        rows = await readXlsxFile(filePath, { sheet: 2 });
        if (rows.length < 2) throw "At least 1 Question should be provided";

        var questionsArray = [];
        for (var i = 1; i < rows.length; i++) {
            let questionRow = rows[i];
            let [question_in_english, question_in_hindi, correct_option, explanation_in_english, explanation_in_hindi, subjectId] = [questionRow[0], questionRow[1], questionRow[12], questionRow[13], questionRow[14], questionRow[15]]
            if (question_in_english == null) throw "QUESTION IN ENGLISH is blank in Question Number - " + i;
            if (question_in_hindi == null) throw "QUESTION IN HINDI is blank in Question Number - " + i;
            if (correct_option == null) throw "CORRECT ANSWER(A-E) is blank in Question Number - " + i;
            if (explanation_in_english == null) throw "explanation(ENGLISH) is blank in Question Number - " + i;
            if (explanation_in_hindi == null) throw "explanation(HINDI) is blank in Question Number - " + i;
            if (testMetaDeta.subjectId != null) subjectId = testMetaDeta.subjectId;
            if (subjectId == null) throw "Subject ID Required in Question Number - " + i;
            if (validSubjectIds.includes(subjectId) == false) throw "Subject ID of Question Number - " + i + " is Invalid ";


            let options = [];
            if (questionRow[2] == null) throw "Please Provide OPTION A (ENGLISH) for Question Number - " + i;
            if (questionRow[7] == null) throw "Please Provide OPTION A (HINDI) for Question Number - " + i;


            for (var g = 2; g < 7; g++) {

                if (questionRow[g] == null) continue;
                if (questionRow[g + 5] == null) { console.log("THROWING ERROR"); throw `Please Provide HINDI option also for Question Number ${i} Option Number ${g}` };
                if (g == 2)
                    var option = { id: "A", text: { EN: questionRow[g], HI: questionRow[g + 5] } };
                if (g == 3)
                    var option = { id: "B", text: { EN: questionRow[g], HI: questionRow[g + 5] } };
                if (g == 4)
                    var option = { id: "C", text: { EN: questionRow[g], HI: questionRow[g + 5] } };
                if (g == 5)
                    var option = { id: "D", text: { EN: questionRow[g], HI: questionRow[g + 5] } };
                if (g == 6)
                    var option = { id: "E", text: { EN: questionRow[g], HI: questionRow[g + 5] } };
                options.push(option)
            }
            questionsArray.push({ text: { "EN": question_in_english, "HI": question_in_hindi }, options, correct_answer_id: correct_option, explanation_in_english, explanation_in_hindi, subject_id: subjectNumToId[subjectId] })

        }

        return { testMetaDeta, questionsArray };

    } catch (error) {
        console.log(error);
        throw error;
    }

}