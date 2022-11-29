const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");

app.get("/",(req,res)=>{
    res.render("home");
});

app.route("/login")
.get((req,res)=>{
    res.render("login");
})
.post((req,res)=>{
    res.render("secrets");
});

app.route("/register")
.get((req,res)=>{
    res.render("register");
})
.post((req,res)=>{
    res.render("secrets");

});


app.listen(3000,()=>{
    console.log("started app on port 3000\nhttp://localhost:3000");
});