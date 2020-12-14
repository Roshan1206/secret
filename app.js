//jshint esversion:6
//npm packages

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//encryption using mongoose
// const encrypt = require("mongoose-encryption");

//hashing using md5
// const md5 = require("md5");

//bcryot = hashing+salting
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

//passport, passpport-local-mongoose,
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//express-session
const session = require("express-session");

//oAuth2.0 for google
const GoogleStrategy = require('passport-google-oauth20').Strategy;

//findOrCreate
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

//session initialize
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

//passport initialize
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

//plugins

//for passport
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//for monngoose-encryption
// requires mongoose-encryption & env requuires dotenv
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"]
// });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

//passport serialize and deserialize users
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//passport google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {

  // bcrypt encryption
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash
  //   });
  //
  //   newUser.save(function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.render("secrets");
  //     }
  //   });
  // });

  // md5 encryption
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: md5(req.body.password)
  //   });
  //
  //   newUser.save(function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.render("secrets");
  //     }
  //   });
  // });

  //passport
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  // username = req.body.username;
  // password = req.body.password;
  // //password = md5(req.body.password);    md5 decryptiion
  //
  // User.findOne({
  //   email: username
  // }, function(err, foundUser) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     bcrypt.compare(password, foundUser.password, function(err, result){
  //       if(result === true){
  //         res.render("secrets");
  //       }
  //     });
  //   }
  // });

  //passport login
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  })
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
