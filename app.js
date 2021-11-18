//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// # 1 Mongoose 연결
mongoose.connect("mongodb://localhost:27017/userDB");

// # 2
const userSchema = {
	email: String,
	password: String,
};
const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
	res.render("home");
});

app.get("/login", function (req, res) {
	res.render("login");
});
app.get("/register", function (req, res) {
	res.render("register");
});

app.post("/register", function (req, res) {
	const newUser = new User({
		// userSchema로부터 받아옴
		email: req.body.username, // email input name, password와 일치(받아옴)
		password: req.body.password,
	});
	newUser.save(function (err) {
		if (err) {
			console.log(err);
		} else {
			res.render("secrets"); // 유저가 성공적으로 db를 만들어야만 secret 으로 접속할 수 있다.
		}
	});
});
app.post("/login", function (req, res) {
	const username = req.body.username;
	const password = req.body.password;

	User.findOne({ email: username }, function (err, foundUser) {
		//email은 저장된 db에서 username은 form에서 가져옴.
		if (err) {
			console.log("the email cannot be found.");
		} else {
			if (foundUser) {
				if (foundUser.password === password) {
					res.render("secrets");
				}
			}
		}
	});
});

app.listen(3000, function () {
	console.log("Server started on port 3000");
});
