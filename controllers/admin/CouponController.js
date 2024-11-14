require('dotenv').config()

const UserModel = require('../../models/UserModel')
//helper file to prepare responses.
const apiResponse = require('../../helpers/apiResponse')
const ResultModel = require('../../models/ResultModel')
const Config = require('../../models/Config')
const { changeConfig, createCouponValidation, updateCouponValidation } = require('../../validator/validator_function')
const Coupon = require('../../models/CouponModel')
const moment = require('moment')

exports.getCouponList = async (req, res) => {
  try {
    var couponList = await Coupon.find().sort({ _id: -1 }).exec()
    const flashData = req.flash();

    return res.render('admin/coupons/showCoupons.ejs', {
      user: req.user,
      CouponsData : couponList,
      myvalue: flashData.data ? flashData.data[0] : {},
      moment,
      error: flashData.error ? flashData.error[0] : '',
      msg: flashData.msg ? flashData.msg[0] : '',
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

exports.updateCoupon = async (req, res) => {

  try {
      const result = await updateCouponValidation.validateAsync(req.body);
      const { coupon_id,code,description,amount,min_purchase_amount,max_discount_amount,percentage,expiry_date,status } = result;
      const isCouponCodeUsed = await Coupon.findOne({_id:{ $ne: coupon_id },code:code})
      if(isCouponCodeUsed){
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'),"Coupon code is already in use ");
      }
      const expiry_date_updated = moment(expiry_date, "YYYY-MM-DD").toDate();
      console.log("expiry_date::",expiry_date_updated,coupon_id);

      const updateResult  =await Coupon.updateOne({ _id:coupon_id }, { code,description,amount,min_purchase_amount,max_discount_amount,percentage,expiry_date: expiry_date_updated,status });
      console.log("updateResult::",updateResult);
      if (updateResult.modifiedCount === 0) {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Coupon not found");
      }

      return apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), `Successfully updated One Coupon !`);
      
  } catch (error) {
    console.log("error::",error);
      if (error.isJoi) {
          return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
      } else {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
      }
  }
}

exports.createCoupon = async (req, res) => {

  try {
    
      const result = await createCouponValidation.validateAsync(req.body);
      const { code,description,amount,min_purchase_amount,max_discount_amount,percentage,expiry_date } = result;
      const isCodeUsed = await Coupon.findOne({code})
      if(isCodeUsed){
        const flashData = {
          data: {
            code,
            description,
            amount,
            min_purchase_amount,
            max_discount_amount,
            percentage,
            expiry_date,
          },
          error: 'Coupon code is already in use',
        };
        return apiResponse.redirectWithFlashErrorWithData(req, res, req.get('Referrer'), "Coupon code is already in use !",flashData)
      }
      await Coupon.create({ code,description,amount,min_purchase_amount,max_discount_amount,percentage,expiry_date,status:'active' });
      
      return apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), "Succefully created !");
  } catch (error) {
    console.log("error::",error);
      if (error.isJoi) {
          return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), error.details[0].message);
      } else {
        return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), JSON.stringify(error));
      }
  }
}
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon_id = req.params.coupon_id;

    const existingCoupon = await Coupon.findById(coupon_id);
    if (!existingCoupon) {
      return apiResponse.notFoundResponse(res, "Coupon not found");
    }

    const deleteResult = await Coupon.deleteOne({ _id: coupon_id });

    if (deleteResult.deletedCount === 0) {
      return apiResponse.redirectWithFlashError(req, res, req.get('Referrer'), "Coupon could not be deleted");
    }
    return apiResponse.redirectWithFlashMsg(req, res, req.get('Referrer'), "Coupon deleted successfully");
  } catch (error) {
    console.error("error::", error);
    return apiResponse.ErrorServer(res, error.message);
  }
}



