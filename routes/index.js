var express = require("express");
var router = express.Router();
const AuthController = require("../controllers/AuthController");

/* GET home page */
router.get("/", function (req, res) {
	res.render("index", { title: "Express" });
});


//Password Reset for Client
router.get("/reset-password/:resetToken", AuthController.passwordResetForm);
router.post("/reset-password", AuthController.resetPassword);

module.exports = router;
