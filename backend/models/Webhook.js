const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const webhookSchema = new Schema({
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
    url: {
        type: String,
        required: true,
        trim: true
    },
    events: {
        type: String,
        default: 'expense.created'
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

webhookSchema.index({ user_id: 1 });

module.exports = mongoose.model('Webhook', webhookSchema);
