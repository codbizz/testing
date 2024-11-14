var mongoose = require('mongoose')
const axios = require('axios')
const crypto = require('crypto')

async function initPhonePe (amount, debug, platform) {
  let transactionId = `mock_${Date.now()}`

  const payload = {
    merchantId: debug ? 'PGTESTPAYUAT124' : process.env.PHONEPE_MERCHENT_ID,
    merchantTransactionId: transactionId,
    merchantUserId: debug ? 'MUID123' : process.env.PHONEPE_MERCHENT_USER_ID,
    amount: amount * 100,
    redirectUrl: process.env.PHONEPE_REDIRECT,
    redirectMode: 'REDIRECT',
    callbackUrl: process.env.PHONEPE_CALLBACK,
    mobileNumber: debug ? '9999999999' : mobileNumber,
    paymentInstrument: { type: 'PAY_PAGE' }
  }

  const base64Data = Buffer.from(JSON.stringify(payload)).toString('base64')
  const salt = debug
    ? '518e068c-4fae-40b7-aa17-afb3229cbde0'
    : process.env.PHONEPE_SALT

  const sha256Hash = crypto
    .createHash('sha256')
    .update(`${base64Data}/pg/v1/pay${salt}`)
    .digest('hex')

  const url = debug
    ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay'
    : 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
  if (platform == 'WEB') {
    var response = await axios.post(
      url,
      {
        request: `${base64Data}`
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': `${sha256Hash}###1`
        }
      }
    )
    return response.data
  }

  const respons = {
    base64Data,
    sha256Hash: `${sha256Hash}###1`,
    url,
    salt,
    data: {
      merchantTransactionId: transactionId
    },
    redirectUrl: process.env.PHONEPE_REDIRECT,
    callbackUrl: process.env.PHONEPE_CALLBACK
  }
  return respons
}

async function validatePaymentVerification (transactionId, amount, debug) {
  const salt = debug
    ? '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'
    : process.env.PHONEPE_SALT

  const PHONEPE_MERCHENT_ID = process.env.PHONEPE_MERCHENT_ID

  const sha256Hash = crypto
    .createHash('sha256')
    .update(
      `/pg/v1/status/${
        debug ? 'MERCHANTUAT' : PHONEPE_MERCHENT_ID
      }/${transactionId}${salt}`
    )
    .digest('hex')

  const url = debug
    ? `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/MERCHANTUAT/${transactionId}`
    : `https://api.phonepe.com/apis/hermes/pg/v1/status/${PHONEPE_MERCHENT_ID}/${transactionId}`

  var response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': `${sha256Hash}###1`
    }
  })
  return response.data.data
}

module.exports = {
  initPhonePe,
  validatePaymentVerification
}
