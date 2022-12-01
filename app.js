require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require("passport-facebook");
// const GitHubStrategy = require("passport-github2");
// const TwitterStrategy = require("passport-twitter").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    facebookId:String,
    githubId:String
});
const secretSchema = new mongoose.Schema({
    secret:String
})
const Secret = new mongoose.model("Secret",secretSchema);
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
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, (err, user) => {
            return cb(err, user);
        });
    }
));
// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: "http://127.0.0.1:3000/auth/facebook/secrets"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     console.log(profile)
//     User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

// passport.use(new GitHubStrategy({
//     clientID: process.env.GITHUB_CLIENT_ID,
//     clientSecret: process.env.GITHUB_CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/github/secrets"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     console.log(profile);
//     User.findOrCreate({ githubId: profile.id },(err, user)=> {
//       return done(err, user);
//     });
//   }
// ));
// passport.use(new TwitterStrategy({
//     consumerKey: process.env.TWITTER_CONSUMER_KEY,
//     consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
//     callbackURL: "http://localhost:3000/auth/twitter/secrets"
//   },
//   function(token, tokenSecret, profile, cb) {
//     User.findOrCreate({ twitterId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));
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

// app.get("/auth/facebook",
//   passport.authenticate("facebook"));

// app.get("/auth/facebook/secrets",
//   passport.authenticate("facebook", { failureRedirect: "/login" }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect("/secrets");
//   });

//   app.get("/auth/github",
//   passport.authenticate("github", { scope: [ "user:email" ] }));

// app.get("/auth/github/secrets", 
//   passport.authenticate("github", { failureRedirect: "/login" }),
//   function(req, res) {
//     // Successful authentication, redirect secrets.
//     res.redirect("/secrets");
//   });
//   app.get("/auth/twitter",
//   passport.authenticate("twitter"));

// app.get("/auth/twitter/secrets", 
//   passport.authenticate("twitter", { failureRedirect: "/login" }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect("/secrets");
//   });

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

        Secret.find({},(err,secrets)=>{
            if(!err)
            {
                res.render("secrets",{secrets})

            }
          });      
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
        if(req.isAuthenticated())
        {
            res.render("submit");
        }else{
            res.redirect("/login");
        }
    })
    .post((req, res) => {
        const secret = new Secret({secret:req.body.secret});
        secret.save((err)=>{
            if(!err)
            {
              Secret.find({},(err,secrets)=>{
                if(!err)
                {
                    res.render("secrets",{secrets})

                }
              });      
            }
        });
        
    });

app.listen(3000, () => {
    console.log("started app on port 3000\nhttp://localhost:3000");
});