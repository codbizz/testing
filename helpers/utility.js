const jwt = require("jsonwebtoken");
require("dotenv").config();
exports.randomNumber = function (length) {
	var text = "";
	var possible = "123456789";
	for (var i = 0; i < length; i++) {
		var sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};

exports.makeJwtTokenForClient = function (jwtPayload) {
	try {
		const jwtData = {
			expiresIn: process.env.JWT_TIMEOUT_DURATION,
		};
		const secret = process.env.JWT_SECRET;
		//Generated JWT token with Payload and secret.
		return jwt.sign(jwtPayload, secret, jwtData);
	} catch (e) {
		throw e;
	}
}


