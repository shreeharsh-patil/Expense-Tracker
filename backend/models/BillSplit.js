const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const billSplitSchema = new Schema({
    expense_id: {
        type: Schema.Types.ObjectId,
        ref: 'Expense',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friend_name: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    settled: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

billSplitSchema.index({ expense_id: 1 });
billSplitSchema.index({ user_id: 1 });

module.exports = mongoose.model('BillSplit', billSplitSchema);
