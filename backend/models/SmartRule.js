const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const smartRuleSchema = new Schema({
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
    pattern: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: null
    },
    tags: {
        type: String, // comma-separated Tag IDs
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

smartRuleSchema.index({ user_id: 1, priority: -1 });

module.exports = mongoose.model('SmartRule', smartRuleSchema);
