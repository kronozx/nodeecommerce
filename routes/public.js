const express = require('express');
const router = express.Router();
const Gift = require('../models/Gift');

let priceOption = "all";
let cartTotal;
let payMethod;

// Home Route
router.get("/", function(req, res){
    /*if(!req.session.visitorcount) {
        req.session.visitorcount = 1;
    } else {
        req.session.visitorcount += 1;
    }*/
    res.render("home");
});

// Products Route
router.get("/gifts", function(req, res){
    Gift.find({}, (err, products) => {
        if (err) {
            console.log(err);
        } else {
            res.render("gifts", { products: products, priceOption: priceOption });
        }
    }); 
});

router.post("/gifts", function(req, res) {
    priceOption = req.body.option;
    //console.log(priceOption);
    res.redirect("/gifts");
});

// Show Product Route
router.get("/gifts/:id", function(req, res) {
    Gift.findById(req.params.id, (err, foundProduct) => {
        if (err) {
            res.redirect("/gifts");
        } else {
            res.render("show", {product: foundProduct});
        }
    });
});

// Add Item to Cart POST Route

router.post("/gifts/checkout", function(req, res) {
    //console.log(req.body.productId);
    if(!req.session.cartItems) {
        req.session.cartItems = [];
    }
    const existingItem = req.session.cartItems.find(item => item._id === req.body.productId);
    if (existingItem) {
        req.flash('error', "Ya tienes ese producto en tu carrito.");
        res.redirect("/gifts"); 
    } else {
        Gift.findById(req.body.productId, (err, foundProduct) => {
            if (err) {
                console.log(err);
            } else {
                req.session.cartItems.push(foundProduct);
                priceOption = "all";
                console.log(req.session.cartItems.length);
                res.redirect("/cart");
            }
        });
    }    
});

// GET request and Show Items in Cart
router.get("/cart", function(req, res) {
    if (!req.session.cartItems) {
        res.redirect("/gifts");
    } else {
    console.log(req.session.cartItems.length);  
    res.redirect("/cart/checkout");   
    }
});


router.get("/cart/checkout", (req, res) => {
    if (!req.session.cartItems) {
        res.redirect("/gifts");
    }
    let buttonPayStatus = 'active';
    let total = 0;
    for (let item of req.session.cartItems) {
        total += (parseInt(item.price));
    }
    if (req.session.cartItems.length === 0) {
        buttonPayStatus = 'inactive';
    }
    console.log(total);
    res.render("shoppingCart", {cartItems: req.session.cartItems, total: total, buttonPayStatus: buttonPayStatus});
});

// Order Route
router.post("/cart/purchase", (req, res) => {
    console.log(req.body.cartTotal);
    res.render("checkout", {total: req.body.cartTotal});
});

// End Order Route POST
router.post("/cart/purchase/end", (req, res) => {
    payMethod = req.body.option;
    cartTotal = parseInt(req.body.cartTotal);
    console.log(payMethod);
    res.redirect('/cart/purchase/end');
});

router.get("/cart/purchase/end", (req, res) => {
    res.render('checkoutEnd', {total: cartTotal, payMethod: payMethod});
});

router.post("/cart/purchase/redirect", (req, res) => {
    cartTotal = 0;
    payMethod = '';
    req.session.cartItems = null;
    res.redirect('/gifts');
});

// Receive a POST request to delete item from cart
router.post("/cart/products/delete", (req, res) => {
    const itemsOnCart = req.session.cartItems.filter(item => item._id != req.body.itemId);
    req.session.cartItems = itemsOnCart;
    res.redirect("/cart");
});

module.exports = router;