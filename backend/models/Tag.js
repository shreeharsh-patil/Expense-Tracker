const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
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
    color: {
        type: String,
        default: '#6366f1'
    }
});

// Enforce unique tag name per user
tagSchema.index({ user_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tag', tagSchema);
