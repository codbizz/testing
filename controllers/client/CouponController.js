require('dotenv').config()
const apiResponse = require('../../helpers/apiResponse')
const SetModel = require('../../models/SetModel')
const TransactionModel = require('../../models/TransactionModel')
var mongoose = require('mongoose')
const axios = require('axios')
const crypto = require('crypto')
const {
  createOrder,
  markOrderSuccess,
  phonePePGSchema
} = require('../../validator/validator_function')
const mailer = require('../../helpers/mailer')
const phonePe = require('../../helpers/phonepe_utils')

const { json } = require('express')
const { constants } = require('../../helpers/constants')
const PointTransaction = require('../../models/PointTransaction')
const Coupon = require('../../models/CouponModel')



exports.getCoupons = async (req, res) => {
  try {
    const { search } = req.query; 

    let query = { status: 'active' };

    if (search) {
      query = {
        $and: [
          { status: 'active' }, // Add the status condition
          {
            $or: [
              { code: { $regex: search, $options: 'i' } }, // Case-insensitive code search
              { description: { $regex: search, $options: 'i' } }, // Case-insensitive description search
            ],
          },
        ],
      };
    }

    // Use Mongoose to find coupons based on the query
    const coupons = await Coupon.find(query);

    // Respond with the list of coupons
    return apiResponse.successResponseWithData(res, '', coupons)
  } catch (error) {
    // Handle errors and respond with an error message
    console.error("Error:", error);
    return apiResponse.ErrorServer(res, error.message)
  }
};



