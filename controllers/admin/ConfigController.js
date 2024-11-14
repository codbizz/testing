require('dotenv').config()

const UserModel = require('../../models/UserModel')
//helper file to prepare responses.
const apiResponse = require('../../helpers/apiResponse')
const ResultModel = require('../../models/ResultModel')
const Config = require('../../models/Config')
const { changeConfig } = require('../../validator/validator_function')

exports.getConfigList = async (req, res) => {
  try {
   

    // req.query.order_id ? filter.order_id = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";

    var ConfigList = await Config.find()
    console.log("ConfigList::",ConfigList);
    return res.render('admin/config/showConfig.ejs', {
      user: req.user,
      configList: ConfigList,
      myvalue: req.query,
      error: req.flash('error'),
      msg: req.flash('msg')
    })
  } catch (error) {
    console.log(error)
    return apiResponse.redirectWithFlashError(
      req,
      res,
      req.get('Referrer') ?? '/admin/dashboard    ',
      error.toString()
    )
  }
}

exports.updateConfig = async (req, res) => {

  try {
      const result = await changeConfig.validateAsync(req.body);
      const { key,value } = result;
      await Config.updateOne({ key }, { value });
      const configList =await Config.find()
      return apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), "Succefully updatedd !");
  } catch (error) {
    console.log("error::",error);
      if (error.isJoi) {
          return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
      } else {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
      }
  }
}



