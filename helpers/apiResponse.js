exports.successResponse = function (res, msg) {
	var data = {
		status: 1,
		message: msg
	};
	return res.status(200).json(data);
};

exports.successResponseWithData = function (res, msg, data) {
	var resData = {
		status: 1,
		message: msg,
		data: data
	};
	return res.status(200).json(resData);
};

exports.ErrorResponse = function (res, msg) {
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(400).json(data);
};

exports.ErrorServer = function (res, msg) {
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(500).json(data);
};

exports.notFoundResponse = function (res, msg) {
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(404).json(data);
};

exports.validationErrorWithData = function (res, msg, data) {
	var resData = {
		status: 0,
		message: msg,
		data: data
	};
	return res.status(400).json(resData);
};

exports.unauthorizedResponse = function (res, msg) {
	var data = {
		status: 0,
		message: msg,
	};
	return res.status(401).json(data);
};

exports.redirectWithFlashError = function (req, res, path, msg) {
	req.flash("error", msg);
	if (path == null) path = "/admin/dashboard";
	return res.redirect(path);
}

exports.redirectWithFlashErrorWithData = function (req, res, path, msg,flashData) {
	req.flash("data", flashData.data); 
	req.flash("error", msg);
	if (path == null) path = "/admin/dashboard";
	return res.redirect(path);
}

exports.redirectWithFlashMsg = function (req, res, path, msg) {
	req.flash("msg", msg);
	if (path == null) path = "/admin/dashboard";
	return res.redirect(path);
}