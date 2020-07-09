const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('../middleware');

// User and Products model
const User = require('../models/user');
const Gift = require('../models/Gift');

// Use crypto to create the emailToken and verify emails when signing up
const crypto = require('crypto');

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Using multer and cloudinary on the user (user as admin) routes file
const multer = require('multer');
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter});

const cloudinary = require('cloudinary');
const { doesNotMatch } = require('assert');
cloudinary.config({ 
  cloud_name: 'freelance2002', 
  api_key: process.env.CLOUD_KEY, 
  api_secret: process.env.CLOUD_SECRET
});

//------------------------------------------------

//Admin Dashboard
router.get("/dashboard", middleware.isLoggedInAdmin, function(req, res){
    Gift.find({}, (err, products) => {
        if (err) {
            console.log(err);
        } else {
            res.render("user/dashboard", { username: req.user.username, products: products });
        }
    }); 
 });


 //New Product Route
router.get("/dashboard/new", middleware.isLoggedInAdmin, (req, res) => {
    res.render("user/new");
});

//Create Product Route
router.post('/dashboard', middleware.isLoggedInAdmin, upload.single('image'), (req, res) => {
    // Cloudinary code
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        // add cloudinary url for the image to the Gift object under image property
        req.body.image = result.secure_url;
        console.log(result.public_id);
        Gift.create({
            product: req.body.product,
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            image: req.body.image,
            reference: req.body.reference
        }, (err, item) => {
            if (err) {
                console.log(err);
            } else {
                //console.log(req.body);
                res.redirect("dashboard");
            }
        });
      });
});

//Show Product Route
router.get("/dashboard/:id", middleware.isLoggedInAdmin, (req, res) => {
    Gift.findById(req.params.id, (err, foundProduct) => {
        if (err) {
            res.redirect("products");
        } else {
            res.render("user/show", {product: foundProduct});
        }
    });
});

//Edit Product Route
router.get('/dashboard/:id/edit', middleware.isLoggedInAdmin, (req, res) => {
    Gift.findById(req.params.id, (err, product) => {
        if (err) {
            res.redirect('/dashboard');
        } else {
            res.render("user/edit", {product: product});
        }
    });
});

// Update Product Route
router.put('/dashboard/:id', middleware.isLoggedInAdmin, (req, res) => {
    //console.log(req.params.id);
    //console.log(req.body.product);
    Gift.findByIdAndUpdate(req.params.id, req.body.product, (err, updatedtProduct) => {
        if (err) {
            res.redirect("/user/dashboard");
        } else {
            res.redirect("/user/dashboard");
        }
    });
});

//Delete Product Route
router.delete('/dashboard/:id', middleware.isLoggedInAdmin, (req, res) => {
    cloudinary.v2.uploader.destroy('pmblopfxfmz6a2xphtm0', function(error,result) {
        console.log(result, error);
        Gift.findById(req.params.id, (err, product) => {
            if (err) {
                res.redirect('/dashboard');
            } else {
                console.log(product.image);
                res.redirect("/user/dashboard");
            }
        });
    });
    
    /*cloudinary.v2.uploader.destroy('public_id', function (result) {
                console.log(result);
            });*/
    /*Gift.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/user/dashboard");
        } else {
            res.redirect("/user/dashboard");
        }
    });*/ 

});

 //AUTH ROUTES

//User Register
router.get("/register", middleware.isNotLoggedIn, function(req, res){
    res.render("user/register"); 
 });

 //User Register Handling
 router.post("/register", middleware.isNotLoggedIn, async function(req, res){
    const emailExists = await User.findOne({ email: req.body.email });
    if(emailExists) {
        console.log("email already in use");
        req.flash("error", "The email provided is already in use.")
        return res.redirect("back");
    }
    
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        emailToken: crypto.randomBytes(64).toString('hex'),
        isVerified: false
    });
    
    if(req.body.admincode === "adminCode321") {
        newUser.isAdmin = true;
    }

    User.register(newUser, req.body.password, async function(err, user){
         if(err){
             console.log(err);
             return res.render('user/register', {error: err.message});
         } else {
            const msg = {
                to: user.email,
                from: 'jorgegarcias@gmail.com',
                subject: 'Verifica tu Cuenta en Regala Amor',
                text: `Thanks for registering. Please copy and paste the address below to verify your account.
                    http://${req.headers.host}/user/verify-email?token=${user.emailToken}
                `,
                html: `
                    <h1>Hello</h1>
                    <p>Thanks for registering.</p>
                    <p>Please click the link below to verify your account.</p>
                    <a href="http://${req.headers.host}/user/verify-email?token=${user.emailToken}">Verificar Cuenta</a>
                `
              };

              try {
                await sgMail.send(msg);
                req.flash("success", `Gracias por registrarte. Por favor Verifica tu Cuenta desde tu email.`);
                res.redirect("/");
              } catch (error) {
                console.log(error);
                req.flash("error", `Something went wrong, please contact us and report this problem`);
                res.redirect("/");                
              }
            }                        
         });  

    });

//Email verification route
router.get("/verify-email", async function(req, res, next) {
    try {
        const user = await User.findOne({ emailToken: req.query.token });
        if(!user) {
            req.flash("error", "Token is invalid. Please try registering again.")
            return res.redirect("/");
        }
        user.emailToken = null;
        user.isVerified = true;
        await user.save();
        await req.login(user, async function(err) {
            if(err) {
                return next(err);
            } 
            req.flash("success", `Welcome to Regala Amor ${user.username}`);
            res.redirect("/");
        });
    } catch(error) {
        console.log(error);
        req.flash("error", "Something went wrong, please contact us and report this problem");
        res.redirect("/");
    }
});

//Reset Password routes
//forgot password
router.get("/forgot", function(req, res) {
    res.render("user/forgot");
});

router.post("/forgot", function(req, res) {
    const resetToken = crypto.randomBytes(64).toString('hex');

    User.findOne({ email: req.body.email }, async function(err, user) {
        if (!user) {
            console.log('no user found');
            req.flash("error", "No account found with that email address.");
            return res.redirect("/user/forgot");
        } 
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save();        

        const msg = {
            to: user.email,
            from: 'jorgegarcias@gmail.com',
            subject: 'Cambiar tu Password de Regala Amor',
            text: `You received this message because you have requested to change your password.
            Please click on the following link, or paste this into your browser to complete the process of resetting your password:
                http://${req.headers.host}/user/forgot/:${user.resetPasswordToken}
            `,
            html: `
                <h1>Hello</h1>
                <p>Thanks for registering.</p>
                <p>Please click the link below to verify your account.</p>
                <a href="http://${req.headers.host}/user/reset/${user.resetPasswordToken}">Cambiar Password</a>            `
          };
          try {
            await sgMail.send(msg);
            req.flash("success", `Te enviamos un mensaje a tu correo para resetear tu password.`);
            res.redirect("/user/forgot");
          } catch (error) {
            console.log(error);
            req.flash("error", `Something went wrong, please contact us and report this problem`);
            res.redirect("/user/forgot");                
          }
    });
});

router.get("/reset/:token", function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash("error", "Token is invalid or has expired. Please go to reset password again.")
            return res.redirect("/user/forgot");
        }
        res.render('user/reset', { token: req.params.token });
    });
});

router.post("/reset/:token", function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user) {
        if (!user) {
            console.log("not user found");
            req.flash("error", "Password token invalid or has expired.");
            return res.redirect('/');
        }
        if (req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
                user.resetPasswordToken = null;
                user.resetPasswordExpires = null;

                user.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                    req.logIn(user, async function(err) {
                        if (err) {
                            console.log(err);
                        }
                        //send email confirmating password change
                        const msg = {
                            to: user.email,
                            from: 'jorgegarcias@gmail.com',
                            subject: 'Cambio Exitoso de tu Password de Regala Amor',
                            text: `Hola ${user.username}. Este es un mensaje confirmando el cambio de tu password en Regala Amor`,
                            html: `
                                <h1>Hello ${user.username}</h1>
                                <p>Este es un mensaje confirmando el cambio exitoso de tu password en Regala Amor</p>
                                `
                          };
                          try {
                            await sgMail.send(msg);
                            req.flash("success", "Tu Password ha sido cambiado exitosamente.");
                            res.redirect("/");
                          } catch (error) {
                            console.log(error);
                            req.flash("error", `Something went wrong, please contact us and report this problem`);
                            res.redirect("/");                
                          }
                    });
                });
            });
        } else {
            req.flash("error", "Passwords do not match");
            return res.redirect('/');
        }
    });

});
 
 //Admin Login
 router.get("/login", middleware.isNotLoggedIn, function(req, res){
    res.render("user/login"); 
 });

 //Admin login handling
 router.post("/login", middleware.isNotLoggedIn, middleware.isNotVerified, passport.authenticate("local", {
     successRedirect: "/user/dashboard",
     failureRedirect: "/user/login",
     failureFlash: true,
     successFlash: 'Bienvenido a Regala Amor'
 }) , function(req, res){
 });

//Admin Logout
 router.get("/logout", middleware.isLoggedIn, function(req, res){
     req.session.cartItems = null;
     req.logout();
     req.flash("error", "Has Terminado la Sesión");
     res.redirect("/");
 });

module.exports = router;