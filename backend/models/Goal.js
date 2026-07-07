const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const goalSchema = new Schema({
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
    target_amount: {
        type: Number,
        required: true
    },
    current_saved: {
        type: Number,
        default: 0
    },
    deadline: {
        type: String, // stored in YYYY-MM-DD format
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

goalSchema.index({ user_id: 1 });

module.exports = mongoose.model('Goal', goalSchema);
