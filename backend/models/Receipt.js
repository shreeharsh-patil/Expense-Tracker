const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const receiptSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expense_id: {
        type: Schema.Types.ObjectId,
        ref: 'Expense',
        default: null
    },
    filename: {
        type: String,
        required: true
    },
    original_name: {
        type: String,
        required: true
    },
    filepath: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: null
    },
    category: {
        type: String,
        default: null
    },
    raw_text: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

receiptSchema.index({ user_id: 1 });
receiptSchema.index({ expense_id: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
