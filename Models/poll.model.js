const mongoose = require('mongoose');
const pollSchema = mongoose.Schema({
    title: String,
    category: String,
    start_date: String,
    end_date: String,
    min_reward: Number,
    max_reward: Number,
    question_sets: [{
        questionType: { type: String, enum: ['Single', 'Multiple'] },
        questionText: String,
        options: [String]
    }],
    analytics: {
        total_submissions: { type: Number, default: 0 },
        average_reward: { type: Number, default: 0 },
        user_responses: [{
            user_id: String,
            responses: [{
                question: String,
                answer: String
            }],
            reward_earned: Number
        }]
    }
}
    , {
        versionKey: false
    })

const PollModel = mongoose.model("poll", pollSchema)

module.exports = {
    PollModel
}
