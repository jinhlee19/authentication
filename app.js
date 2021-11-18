//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
// # 4 Encryption 
const encrypt = require("mongoose-encryption");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

console.log(process.env.API_KEY);


// # 1 Mongoose 연결
mongoose.connect("mongodb://localhost:27017/userDB");

// # 2 Schema 생성 -> #4 upgrade
const userSchema = new mongoose.Schema ({
    // simple javascript object -> mongoose schema class. 
	email: String, //email < name으로 인한 오기, 오류 
	password: String
}); // 특이한 괄호구조

// # 4 Encryption 
// # 5 Env로 옮김
// const secret = "This is our little secret";
// userSchema.plugin(encrypt, {secret: process.env.secret, requireAuthenticationCode: false, encryptedFields: ["password"]});
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]}); //userSchema의 password에 연결, .env연결
// userSchema.plugin(encrypt, {secret: secret, }); 이걸로 하면 전체가 다  암호화됨. -> npm doc) only encript certain fields 

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
// # 3 Username and Password 

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
		//1. email은 저장된 db에서 2. username은 바로 위의 const username <- form에서 가져옴.
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