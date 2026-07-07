const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const incomeSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: String, // stored in YYYY-MM-DD format
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    account_id: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

incomeSchema.index({ user_id: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);
