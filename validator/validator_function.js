const Joi = require('joi')

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().trim().min(5).required(),
  name: Joi.string().trim().min(1).required()
}).unknown(true)

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
}).unknown(true)

const changePasswordSchema = Joi.object({
  currunt_password: Joi.string().required(),
  new_password: Joi.string().min(4).required()
}).unknown(true)

const forgotPasswordAdmin = Joi.object({
  email: Joi.string().required(),
  dob: Joi.string().required()
}).unknown(true)

const updateNameSchema = Joi.object({
  name: Joi.string().min(3).required()
}).unknown(true)

const createSubject = Joi.object({
  name: Joi.string().min(3).required()
}).unknown(true)

const deleteSubject = Joi.object({
  _id: Joi.string().min(5).required()
}).unknown(true)

const deleteUser = Joi.object({
  userId: Joi.string().min(5).required()
}).unknown(true)

const updateSubject = Joi.object({
  name: Joi.string().min(3).required(),
  _id: Joi.string().min(5).required()
}).unknown(true)

const createCouponValidation = Joi.object({
  code: Joi.string().required(),
  amount: Joi.number().allow(null),
  min_purchase_amount: Joi.number().allow(null),
  max_discount_amount: Joi.number().allow(null),
  percentage: Joi.number().allow(null),
  expiry_date: Joi.string().required(),
  description: Joi.string().required(),
}).unknown(true)

const updateCouponValidation = Joi.object({
  coupon_id: Joi.string().required(),
  code: Joi.string().required(),
  amount: Joi.number().allow(null),
  min_purchase_amount: Joi.number().allow(null),
  max_discount_amount: Joi.number().allow(null),
  percentage: Joi.number().allow(null),
  status: Joi.string(),
  expiry_date: Joi.string().required(),
  description: Joi.string().required(),
}).unknown(true)

const createSet = Joi.object({
  title_english: Joi.string().min(5).required(),
  title_hindi: Joi.string().min(5).required(),
  description_english: Joi.string().min(6).required(),
  description_hindi: Joi.string().min(6).required(),
  description_english: Joi.string().min(10).required(),
  is_paid: Joi.boolean(),
  amount: Joi.number().when('is_paid', {
    is: true,
    then: Joi.number().required().min(1),
    otherwise: Joi.number().valid(0)
  }),
  currency: Joi.string(),
  days_to_expire: Joi.number().when('is_paid', {
    is: true,
    then: Joi.number().required().min(1)
  }),
  active: Joi.boolean(),
  type: Joi.string().valid('MOCK', 'SUBJECT'),
  subject_id: Joi.string().when('type', {
    is: 'SUBJECT',
    then: Joi.string().required()
  })
}).unknown(true)

const changeConfig = Joi.object({
  key: Joi.string().required(),
  value: Joi.string().required(),
}).unknown(true)

const activateDeactivateSet = Joi.object({
  _id: Joi.string().min(5).required()
}).unknown(true)

const updateTest = Joi.object({
  test_id: Joi.string().min(3).required(),
  title_english: Joi.string().min(5).required(),
  title_hindi: Joi.string().min(5).required()
}).unknown(true)

const updateQuestion = Joi.object({
  question_id: Joi.string().min(3).required(),
  question_in_english: Joi.string().min(3).required(),
  question_in_hindi: Joi.string().min(3).required(),
  correct_option: Joi.string()
    .uppercase()
    .valid('A', 'B', 'C', 'D', 'E')
    .required(),
  explanation_in_english: Joi.string().min(3).required(),
  explanation_in_hindi: Joi.string().min(3).required(),
  subject_id: Joi.string().min(3).required(),
  options: Joi.array().min(1).required()
}).unknown(true)

const updateManagerQuestion = Joi.object({
  question_id: Joi.string().required(),
  question_in_english: Joi.string().required(),
  // question_in_hindi: Joi.string().min(3).required(),
  correct_option: Joi.string().required(),
  explanation_in_english: Joi.string().required(),
  // explanation_in_hindi: Joi.string().min(3).required(),
  // subject_id: Joi.string().min(3).required(),
  options: Joi.array().min(1).required()
}).unknown(true)

const removeQuestion = Joi.object({
  test_id: Joi.string().min(3).required(),
  question_id: Joi.string().min(3).required()
}).unknown(true)

const createQuestion = Joi.object({
  test_id: Joi.string().min(3).required(),
  question_in_english: Joi.string().min(3).required(),
  question_in_hindi: Joi.string().min(3).required(),
  correct_option: Joi.string()
    .uppercase()
    .valid('A', 'B', 'C', 'D', 'E')
    .required(),
  explanation_in_english: Joi.string().min(3).required(),
  explanation_in_hindi: Joi.string().min(3).required(),
  subject_id: Joi.string().min(3).required(),
  options: Joi.array().min(1).required()
}).unknown(true)

const createManagerQuestion = Joi.object({
  // test_id: Joi.string().min(3).required(),
  question_in_english: Joi.string().min(3).required(),
  correct_option: Joi.string()
    .uppercase()
    .valid('A', 'B', 'C', 'D')
    .required(),
  explanation_in_english: Joi.string().min(3).required(),
  options: Joi.array().min(1).required()
}).unknown(true)

const fetchQuestionClient = Joi.object({
  test_id: Joi.string().min(3).required(),
  question_ids: Joi.array().min(1).required()
}).unknown(true)

const generateResult = Joi.object({
  test_id: Joi.string().min(3).required(),
  question_answer: Joi.object().required()
}).unknown(true)
const generateManagersResult = Joi.object({
  // quiz_id: Joi.string(),
  data: Joi.object({
    // user_id: Joi.string().required(),
    page: Joi.string().required(),
    total_marks: Joi.number().required(),
    marks_obtained: Joi.number().required(),
    attempted_questions_count: Joi.number().required(),
    not_attempted_questions_count: Joi.number().required(),
    wrong_answers_count: Joi.number().required(),
    correct_answers_count: Joi.number().required(),
    total_positive_marks: Joi.number().required(),
    total_negative_marks: Joi.number().required(),
    question_answer: Joi.array().items(
      Joi.object({
        question_id: Joi.string().required(),
        correct_answer: Joi.string().required(),
        user_answer: Joi.string().allow(''), // Allow an empty string for user_answer
        marks_obtained: Joi.number().required()
      })
    ),
    quiz_number: Joi.number().required(),
    progress_total_time: Joi.string().required(),
  }),
  // createdAt: Joi.string().isoDate().required(),
  // updatedAt: Joi.string().isoDate().required()
}).unknown(true);

const getResult = Joi.object({
  result_id: Joi.string().min(5).required()
}).unknown(true)

const saveTestProgress = Joi.object({
  test_id: Joi.string().min(5).required(),
  at_question_id: Joi.string().min(5).required(),
  total_attempted: Joi.number().required(),
  question_answer_json_string: Joi.string().required()
}).unknown(true)
const saveManagersTestProgress = Joi.object({
  // test_id: Joi.string().min(5).required(),
  // s_no: Joi.number().required(),
  // at_question_id: Joi.string().min(5).required(),
  // page_index: Joi.number().required(),
  // total_attempted: Joi.number().required(),
  // question_answer_json_string: Joi.string().required()
  data: Joi.object({
    at_question_id: Joi.string().required(),
    page_index: Joi.number().required(),
    total_marks: Joi.number().required(),
    marks_obtained: Joi.number().required(),
    attempted_questions_count: Joi.number().required(),
    not_attempted_questions_count: Joi.number().required(),
    wrong_answers_count: Joi.number().required(),
    correct_answers_count: Joi.number().required(),
    total_positive_marks: Joi.number().required(),
    total_negative_marks: Joi.number().required(),
    question_answer: Joi.array().items(
      Joi.object({
        question_id: Joi.string().required(),
        s_no: Joi.number(),
        correct_answer: Joi.string().required(),
        user_answer: Joi.string().allow(''), // Allow an empty string for user_answer
        marks_obtained: Joi.number().required()
      })
    ),
    quiz_number: Joi.number().required(),
    progress_status: Joi.string().required(),
    progress_total_time: Joi.string().required(),
    progress_id: Joi.string().allow('')
  }),
}).unknown(true)

const createOrder = Joi.object({
  set_id: Joi.string().min(5).required(),
  platform: Joi.string().required()
}).unknown(true)

const markOrderSuccess = Joi.object({
  set_id: Joi.string().min(5).required()
}).unknown(true)

const resetPassword = Joi.object({
  reset_token: Joi.string().min(10).required(),
  new_password: Joi.string().min(5).required(),
  new_password_confirm: Joi.string().equal(Joi.ref('new_password')).required()
}).unknown(true)

const phonePePGSchema = Joi.object({
  mobileNumber: Joi.string().min(10).required(),
  amount: Joi.string().min(3).required()
}).unknown(true)

const questionContactUs = Joi.object({
  description: Joi.string().required()
}).unknown(true)

module.exports = {
  registerSchema,
  loginSchema,
  changeConfig,
  changePasswordSchema,
  updateNameSchema,
  createSubject,
  deleteSubject,
  updateSubject,
  createSet,
  activateDeactivateSet,
  updateTest,
  updateCouponValidation,
  updateQuestion,
  updateManagerQuestion,
  removeQuestion,
  deleteUser,
  createQuestion, createManagerQuestion,
  createCouponValidation,
  fetchQuestionClient,
  generateResult,
  generateManagersResult,
  getResult,
  saveTestProgress,
  saveManagersTestProgress,
  createOrder,
  markOrderSuccess,
  resetPassword,
  forgotPasswordAdmin,
  phonePePGSchema,
  questionContactUs
}
