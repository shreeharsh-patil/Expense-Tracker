const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recurringExpenseSchema = new Schema({
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
    description: {
        type: String,
        default: ''
    },
    day_of_month: {
        type: Number,
        required: true,
        min: 1,
        max: 28
    },
    last_processed_month: {
        type: String, // stored in YYYY-MM format
        default: null
    },
    currency: {
        type: String,
        default: 'INR'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

recurringExpenseSchema.index({ user_id: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
