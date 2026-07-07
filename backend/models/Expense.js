const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const expenseSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    payment_method: {
        type: String,
        default: 'Cash'
    },
    date: {
        type: String, // stored in YYYY-MM-DD format
        required: true
    },
    description: {
        type: String,
        default: ''
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
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Indexes for query optimization matching SQLite
expenseSchema.index({ user_id: 1, date: -1 });
expenseSchema.index({ user_id: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
