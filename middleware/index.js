const User = require('../models/user');

const middlewareObj = {};

middlewareObj.isLoggedInAdmin = function(req, res, next){
        if(req.isAuthenticated() && req.user.isAdmin){
            //req.flash("success", "You´re now logged in as an Admin");
            return next();
        } else {
            //req.flash("error", "Por favor haz Login");
            res.redirect("/");
        }
    }

middlewareObj.isLoggedIn = function(req, res, next){
        if(req.isAuthenticated()) {
            //req.flash("success", "You´re now logged in as an Admin");
            return next();
        } else {
            //req.flash("error", "Por favor haz Login");
            res.redirect("/");
        }
    }

middlewareObj.isNotLoggedIn = function(req, res, next) {
        if (req.isAuthenticated()) {
            return res.redirect('/');
        }
        next();
    }

middlewareObj.isNotVerified = async function(req, res, next) {
        try {
            const user = await User.findOne({ username: req.body.username });
            if (user.isVerified) {
                return next();
            }
            req.flash("error", "You need to verify your account before logging in. Please check your email");
            res.redirect("/");
        } catch(error) {
            console.log(error);
            req.flash("error", "Please register first");
            res.redirect('/user/register');
        }    
}

module.exports = middlewareObj;


