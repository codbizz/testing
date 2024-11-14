var express = require("express");
var authRouter = require("./client/auth");
var setRouter = require("./client/set");

var adminRouter = require("./admin/admin");


var app = express();

app.use("/", authRouter);
app.use(setRouter);

//app.use("/admin/", adminRouter);



module.exports = app;