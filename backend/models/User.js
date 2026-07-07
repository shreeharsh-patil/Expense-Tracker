const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password_hash: {
        type: String,
        default: null
    },
    monthly_budget: {
        type: Number,
        default: 10000.0
    },
    phone: {
        type: String,
        default: null
    },
    avatar_url: {
        type: String,
        default: null
    },
    preferred_currency: {
        type: String,
        default: 'INR'
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    oauth_provider: {
        type: String,
        default: null
    },
    oauth_id: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
