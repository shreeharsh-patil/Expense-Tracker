const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const budgetPeriodSchema = new Schema({
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
    amount: {
        type: Number,
        required: true
    },
    period_type: {
        type: String,
        default: 'monthly'
    },
    start_date: {
        type: String, // stored in YYYY-MM-DD format
        required: true
    },
    end_date: {
        type: String, // stored in YYYY-MM-DD format
        default: ''
    },
    rollover: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

budgetPeriodSchema.index({ user_id: 1 });

module.exports = mongoose.model('BudgetPeriod', budgetPeriodSchema);
