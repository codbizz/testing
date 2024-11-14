var express = require("express");
var router = express.Router();
const WebhooksController = require("../controllers/razorpay_webhooks/WebhooksController");

router.post("/order-paid", WebhooksController.handleWebhook);

module.exports = router;
