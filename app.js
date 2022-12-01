require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook");
const findOrCreate = require("mongoose-findorcreate");
/*
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '{your-app-id}',
      cookie     : true,
      xfbml      : true,
      version    : '{api-version}'
    });
      
    FB.AppEvents.logPageView();   
      
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
</script>*/
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
// mongoose.connect("mongodb://localhost:27017/usersDB");
mongoose.connect("mongodb://localhost:27017/facebookDB");


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId:String
});
//create user model
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, (err, user) => {
            return cb(err, user);
        });
    }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);
app.get("/auth/google/secrets", 
    passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
        res.redirect("/secrets");
    }
);

app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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
    req.logout((err) => { if (err) console.log(err) });
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