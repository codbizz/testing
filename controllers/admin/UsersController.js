require('dotenv').config()

const UserModel = require('../../models/UserModel')
//helper file to prepare responses.
const apiResponse = require('../../helpers/apiResponse')
const ResultModel = require('../../models/ResultModel')

exports.getUsersList = async (req, res) => {
  try {
    const options = {
      page: req.query.page == null || req.query.page == '' ? 1 : req.query.page,
      limit:
        req.query.limit == null || req.query.limit == '' ? 10 : req.query.limit,
      sort: '-createdAt',
      lean: {}
    }
    var filter = {}
    req.query.user_email ? (filter.email = req.query.user_email) : ''
    req.query.user_name
      ? (filter.name = { $regex: `.*${req.query.user_name}.*`, $options: 'i' })
      : ''
    if (req.query.type == 'PAID') {
      filter['purchased_set.0'] = { $exists: true }
    }
    if (req.query.type == 'FREE') {
      filter['purchased_set.0'] = { $exists: false }
    }

    // req.query.order_id ? filter.order_id = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
    var userList = await UserModel.paginate(filter, options)

    return res.render('admin/users/users_list.ejs', {
      user: req.user,
      userDetailsPaginated: userList,
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

exports.getResultsList = async (req, res) => {
  try {
    const options = {
      page: req.query.page == null || req.query.page == '' ? 1 : req.query.page,
      limit:
        req.query.limit == null || req.query.limit == '' ? 10 : req.query.limit,
      sort: '-updatedAt',
      populate: 'user_id test_id',
      lean: {}
    }
    var filter = {}
    req.query.user_id ? (filter.user_id = req.query.user_id) : ''
    req.query.test_id ? (filter.test_id = req.query.test_id) : ''

    // req.query.order_id ? filter.order_id = { "$regex": `.*${req.query.question_text}.*`, $options: 'i' } : "";
    var resultList = await ResultModel.paginate(filter, options)

    return res.render('admin/users/result_list.ejs', {
      user: req.user,
      resultDetailsPaginated: resultList,
      myvalue: req.query,
      error: req.flash('error'),
      msg: req.flash('msg')
    })
  } catch (error) {
    console.log(error)
    return apiResponse.redirectWithFlashError(
      req,
      res,
      req.get('Referrer') ?? '/admin/dashboard',
      error.toString()
    )
  }
}
