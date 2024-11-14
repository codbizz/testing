require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require('express-session')
var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");
var adminRouter = require("./routes/admin");
var webhookRouter = require("./routes/webhook");
var apiResponse = require("./helpers/apiResponse");
var cors = require("cors");
var flash = require('connect-flash');


// DB connection
require("./database/db");


var app = express();
//app.use(express.cookieParser('keyboard cat'));
app.use(session({ secret: 'keyboard cat', }));
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static(path.join(__dirname, "uploads")));
app.use('/uploads', express.static('uploads'));
//don't show the log when it is test
if (process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}
app.use(express.json({ limit: "1tb" }));
app.use(express.urlencoded({ limit: "1tb", extended: false }));
app.use(cookieParser());


//To allow cross-origin requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);
app.use("/admin/", adminRouter);
app.use("/webhook/", webhookRouter);



// throw 404 if URL not found
app.all("*", function (req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
	if (err.name == "UnauthorizedError") {
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

module.exports = app;
