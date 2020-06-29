const mongoose = require('mongoose');

const GiftSchema = new mongoose.Schema({
    product: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        require: true
    },
    category: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    reference: {
        type: String,
        require: true
    } 
});


module.exports = mongoose.model('Gift', GiftSchema);