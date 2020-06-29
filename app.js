const express               = require("express");
const app                   = express();
const methodOverride        = require('method-override');
const mongoose              = require("mongoose");
const flash                 = require('connect-flash');
const passport              = require("passport");
const bodyParser            = require("body-parser");
const User                 = require("./models/user");
const LocalStrategy         = require("passport-local");


//ENV Variables
require('dotenv').config();
        
mongoose.connect(process.env.DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log('Connected to DB!');
}).catch(err => {
    console.log('Error', err.message);
});


//EJS
app.set('view engine', 'ejs');

//Load CSS
app.use(express.static(__dirname + "/public"));

//Body-parser middleware
app.use(bodyParser.urlencoded({extended: true}));

//Method Override Middleware
app.use(methodOverride("_method"));

//Express session
app.use(require("express-session")({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

// Use connect-flash
app.use(flash());

//Paspport Middleware
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Locals
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.cart = req.session.cartItems;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


// Routes
app.use('/', require('./routes/public'));
app.use('/user', require('./routes/user'));


app.listen(3000, function(){
    console.log("server started.......");
})