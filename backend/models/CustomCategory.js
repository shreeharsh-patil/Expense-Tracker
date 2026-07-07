const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customCategorySchema = new Schema({
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
    icon: {
        type: String,
        default: 'category'
    },
    color: {
        type: String,
        default: '#6366f1'
    }
});

// Enforce unique category name per user
customCategorySchema.index({ user_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomCategory', customCategorySchema);
