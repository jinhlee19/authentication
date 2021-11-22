//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
// #1-1 const bcrypt = require("bcrypt"); require packages.
const session = require("express-session");
const passport = require("passport");
//passport-local은 plm을 돌리기위해 필요로하지만 code내부에서 require할 필요는 없다.
const passportLocalMongoose = require("passport-local-mongoose");
// #3-1 passport google strategy 
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// #3-4 findOrCreate
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// #1-3 set up the session & initial configuration
app.use(
	session({
		secret: "placeanystring",
		resave: false,
		saveUninitialized: false,
	})
);

// #1-4 (인증을 위해서) 패스포트 패키지를 사용, 1-3에 이어서 패스포트에서 세션을 사용. doc > configuare 확인
app.use(passport.initialize());
app.use(passport.session());

const saltRounds = 10;
const myPlaintextPassword = "s0//P4$$w0rD";
const someOtherPlaintextPassword = "not_bacon";

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
	email: String, //email < name으로 인한 오기, 오류
	password: String,
	// #3-8 GoogleId 
	googleId: String

});

// #1-5 플러그인 연결 - hasing and salting 후, 사용자 id와 pw 저장하기.
userSchema.plugin(passportLocalMongoose); // plugin 연결
// #3-5 플러그인 연결 - findorcreate
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema); //user mongoose Model

// #1-6
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
// passport-local-mongoose npm doc 참조 - simplified passport/passport-local configuration.
passport.use(User.createStrategy());
//strategy 아래로 serialize 위치.

// passport.serializeUser(User.serializeUser()); // 사용자정보가 있는 cookie를 생성.
// passport.deserializeUser(User.deserializeUser()); // 인증을 위해서 cookie의 사용자 정보를 연다.

// # 3-6 passport-local-mongoose의 serialize & deserialize 제거 후, passport의 config로 replace, local
passport.serializeUser(function(user, done) {
	done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
	  done(err, user);
	});
  });
//

// #3-2 GooleStartegy serialize 다음에 배치
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/secrets",
			// #3-7 Google+ deprecation
			userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
		},
		function (accessToken, refreshToken, profile, cb) {
			console.log(profile);
			// #3-4 findOrCreate -> npm install 
			User.findOrCreate({ googleId: profile.id }, function (err, user) {
				return cb(err, user);
			});
		}
	)
);

// #1-6 end

app.get("/", function (req, res) {
	res.render("home");
});
// #3-3
app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile"] })
);
app.get(
	"/auth/google/secrets",
	passport.authenticate("google", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/secrets");
	}
);

app.get("/login", function (req, res) {
	res.render("login");
});
// #2-2 secret
app.get("/secrets", function (req, res) {
	if (req.isAuthenticated()) {
		res.render("secrets");
	} else {
		res.redirect("/login");
	}
});
// # 2-4 logout
app.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});

app.get("/register", function (req, res) {
	res.render("register");
});

// #1-2 app.post -reg, login 삭제
// #2-1 register Section
// passport-local-mongoose 문서 참조 -> User.register는 plm패키지에서 가져옴.
app.post("/register", function (req, res) {
	// 몽구스가 직접 처리하지 않고 plm패키지를 통해 처리. plm이 중간자 역할할 수 있도록 해준다.
	// 자바스크립트 객체이므로 username은 {}컬리 브레이스로 감싸준다.
	// 비밀번호를 연결해 준 후, 콜백함수를 넣어서 인증 후의 처리. err 또는 패스.
	User.register(
		{ username: req.body.username },
		req.body.password,
		function (err, user) {
			if (err) {
				console.log(err);
				res.redirect("/register");
			} else {
				passport.authenticate("local")(req, res, function () {
					//앞구문~ local")까지 성공하면 -> 괄호의 req, res, 콜백함수까지 pass in하게된다. (timestamp: 17:40)
					res.redirect("/secrets");
				});
			}
		}
	);
});
// #2-3 login
app.post("/login", function (req, res) {
	const user = new User({
		username: req.body.username,
		password: req.body.password,
	});
	//req.login <- #passport
	req.login(user, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/secrets");
				// 인증이 되었는지 확인한 후에 쿠키를 들고 /secrets으로 가면 쿠키를 확인해서 또다시 인증을 재확인하고 secrets를 보여준다.
			});
		}
	});
});

app.listen(3000, function () {
	console.log("Server started on port 3000");
});
