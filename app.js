require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
//connect to usersDB
//set view engine
app.set("view engine", "ejs");
//set up body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));






app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/usersDB");
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
//create user model
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});
app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, (err) => {
            if (err) {
                res.send(err);
            } else { 
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
             }
        });
    });

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });

            }

        });
    });


app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {

        res.render("secrets");
    } else {

        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout((err)=>{if(err)console.log(err)});        
    res.redirect("/");
});

app.route("/submit")
    .get((req, res) => {
        res.render("submit");
    })
    .post((req, res) => {
        res.send("<h1>POsted at /submit</h1>")
    });

app.listen(3000, () => {
    console.log("started app on port 3000\nhttp://localhost:3000");
});