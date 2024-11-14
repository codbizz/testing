var express = require("express");
var adminRouter = require("./admin/admin");
var app = express();


app.use("/", adminRouter);



module.exports = app;