const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailOtpSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    password_hash: {
        type: String,
        default: ''
    },
    expires_at: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

emailOtpSchema.index({ email: 1, otp: 1, used: 1 });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
