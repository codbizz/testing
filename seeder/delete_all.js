require('dotenv').config()
var MONGODB_URL = process.env.MONGODB_URL
var mongoose = require('mongoose')
const TestModel = require('../models/TestModel')
const SetModel = require('../models/SetModel')
const QuestionModel = require('../models/QuestionModel')
const QuestionTestRelation = require('../models/QuestionTestRelation')

mongoose
  .connect(MONGODB_URL)
  .then(async () => {
    //don't show the log when it is test

    if (process.env.NODE_ENV !== 'test') {
      console.log('Connected to %s', MONGODB_URL)
      console.log('App is running ... \n')
      console.log('Press CTRL + C to stop the process. \n')
    }

    await TestModel.collection.drop()
    await SetModel.collection.drop()
    await QuestionModel.collection.drop()
    await QuestionTestRelation.collection.drop()
    console.log('Deleted All Data')
    process.exit()
  })
  .catch(err => {
    console.error('App starting error:', err.message)
    process.exit(1)
  })
