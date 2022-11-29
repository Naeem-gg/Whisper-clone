require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');
const app = express();
//connect to usersDB
mongoose.connect("mongodb://localhost:27017/usersDB");
//create user schema
const secretKey = process.env.SECRET;
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(encrypt,{secret:secretKey,encryptedFields:["password"]});
//create user model
const User = new mongoose.model("User", userSchema);
//set view engine
app.set("view engine", "ejs");
//set up body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


app.get("/", (req, res) => {
    res.render("home");
});
app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        User.findOne({email:req.body.username},(err,found)=>{
            if(!found){
                res.send("User Not Found!!!");
            }else if(found.password === req.body.password)
            res.render("secrets");
        });
    });

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {

        const user = new User({ email: req.body.username, password: req.body.password });
        if (user.save()) {
            res.render("secrets");
        }else{
            res.send("error while registering...")
        }

    });

app.get("/logout", (req, res) => {
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