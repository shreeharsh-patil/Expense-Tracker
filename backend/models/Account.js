const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        default: 'bank'
    },
    balance: {
        type: Number,
        default: 0.0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

accountSchema.index({ user_id: 1 });

module.exports = mongoose.model('Account', accountSchema);
