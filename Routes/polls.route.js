const express = require('express');
const { PollModel } = require('../Models/poll.model');
const pollRouter = express.Router()
const { UserModel } = require('../Models/user.model');

// Add a poll to your database
pollRouter.post('/polls', async (req, res) => {
  const { title, category, start_date, end_date, min_reward, max_reward, question_sets, analytics } = req.body;

  try {
    const newPoll = new PollModel({
      title,
      category,
      start_date,
      end_date,
      min_reward,
      max_reward,
      question_sets,
      analytics: {
        total_submissions: 0,
        average_reward: 0,
        user_responses: []
      }
    });
    const createdPoll = await newPoll.save();
    res.json(createdPoll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add a question to a poll
pollRouter.post('/polls/:pollId/questions', async (req, res) => {
  const { pollId } = req.params;
  const { questionType, questionText, options } = req.body;
  try {
    const existingPoll = await PollModel.findById(pollId);

    if (!existingPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    existingPoll.question_sets.push({
      questionType,
      questionText,
      options
    });
    const updatedPoll = await existingPoll.save();
    res.json({ "msg": "Question added sucessfully", "Question": updatedPoll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Get all poll from database
pollRouter.get('/polls', async (req, res) => {
  try {
    const polls = await PollModel.aggregate([
      {
        $facet: {
          pollsData: [
            {
              $project: {
                title: 1,
                category: 1,
                start_date: 1,
                end_date: 1,
                total_votes: '$analytics.total_submissions',
                num_question_sets: { $size: '$question_sets' },
                question_details: { $arrayElemAt: ['$question_sets', 0] }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      polls: polls[0].pollsData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Get a Poll by its id
pollRouter.patch('/polls/:pollId', async (req, res) => {
  const { pollId } = req.params;
  const updateData = req.body;
  try {
    await PollModel.findOneAndUpdate({ _id: pollId }, updateData, { new: true })
    res.status(200).json({ "msg": "Poll data has been updated from database" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

pollRouter.patch('/polls/:pollId/questions/:questionId', async (req, res) => {
  const { pollId, questionId } = req.params;
  const updateData = req.body;

  try {
    // Find the existing poll by ID
    const existingPoll = await PollModel.findById(pollId);

    if (!existingPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const questionToUpdate = existingPoll.question_sets.id(questionId);

    if (!questionToUpdate) {
      return res.status(404).json({ error: 'Question not found in the specified poll' });
    }

    // Update the question properties
    questionToUpdate.questionType = updateData.questionType || questionToUpdate.questionType;
    questionToUpdate.questionText = updateData.questionText || questionToUpdate.questionText;

    // Update options if provided
    if (updateData.options) {
      questionToUpdate.options = updateData.options;
    }

    // Save the updated poll to the database
    const updatedPoll = await existingPoll.save();

    res.status(200).send({ "Updated question": updatedPoll });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Get the status of Polls
pollRouter.get('/user-polls', async (req, res) => {
  const userId = req.body.userid;
  const { startDate, endDate } = req.body;

  try {
    // Find polls within the specified date range
    const polls = await PollModel.find({
      start_date: { $lte: endDate || new Date().toISOString() },
      end_date: { $gte: startDate || new Date().toISOString() }
    });

    if (polls.length === 0) {
      return res.json({ message: 'No new polls exist' });
    }

    // Fetch user from UserModel
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Serve the first unanswered question in the first poll
    for (const poll of polls) {
      const unansweredQuestion = poll.question_sets.find(question => {
        const userVoted = user && user.responses.some(response => response.pollId === poll._id.toString() && response.questionId === question._id.toString());
        return !userVoted;
      });

      if (unansweredQuestion) {
        // Serve the unanswered question
        return res.json({
          pollId: poll._id,
          questionId: unansweredQuestion._id,
          questionType: unansweredQuestion.questionType,
          questionText: unansweredQuestion.questionText,
          options: unansweredQuestion.options
        });
      }
    }

    // If no new polls or unanswered questions found
    return res.json({ message: 'No new polls exist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Vote or submit an answer for particular question
pollRouter.post('/vote/:pollId/:questionId', async (req, res) => {
  const userId = req.body.userid;
  console.log(userId)
  const { pollId, questionId } = req.params;
  const { answer } = req.body;

  try {
    // Find the user by ID
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user has already voted on the question
    const existingVote = user.responses.find(response => response.pollId === pollId && response.questionId === questionId);

    if (existingVote) {
      return res.status(400).json({ error: 'User has already voted on this question' });
    }

    // Find the poll by ID
    const poll = await PollModel.findById(pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Find the question in the poll
    const question = poll.question_sets.id(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found in the specified poll' });
    }

    // Update user's responses
    user.responses.push({
      pollId,
      questionId,
      answer
    });

    // Update poll analytics
    poll.analytics.total_submissions += 1;
    poll.analytics.user_responses.push({
      user_id: userId,
      responses: [{
        question: questionId,
        answer
      }],
      reward_earned: 0
    });

    await user.save();
    await poll.save();

    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get an anlytic of a particular poll]
pollRouter.get('/polls/:pollId/analytics', async (req, res) => {
  const { pollId } = req.params;

  try {
    // Find the poll by ID
    const poll = await PollModel.findById(pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Calculate total votes for the poll
    const totalVotes = poll.analytics.total_submissions;

    // Calculate counts of each option selected within the poll
    const optionCounts = {};
    poll.question_sets.forEach(question => {
      question.options.forEach(option => {
        optionCounts[option] = optionCounts[option] || 0;

        const optionSelectedCount = poll.analytics.user_responses.reduce((count, response) => {
          const userResponse = response.responses.find(r => r.question === question._id.toString());
          if (userResponse && userResponse.answer === option) {
            return count + 1;
          }
          return count;
        }, 0);

        optionCounts[option] += optionSelectedCount;
      });
    });

    // Prepare the response
    const pollAnalytics = {
      totalVotes,
      optionCounts
    };

    res.json(pollAnalytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a analytics of total polls available on database
pollRouter.get('/polls/analytics', async (req, res) => {
  try {
    // Find all polls
    const polls = await PollModel.find();

    // Calculate total votes and option counts for all polls
    let overallTotalVotes = 0;
    const overallOptionCounts = {};

    polls.forEach(poll => {
      overallTotalVotes += poll.analytics.total_submissions;

      poll.question_sets.forEach(question => {
        question.options.forEach(option => {
          overallOptionCounts[option] = overallOptionCounts[option] || 0;

          const optionSelectedCount = poll.analytics.user_responses.reduce((count, response) => {
            const userResponse = response.responses.find(r => r.question === question._id.toString());
            if (userResponse && userResponse.answer === option) {
              return count + 1;
            }
            return count;
          }, 0);

          overallOptionCounts[option] += optionSelectedCount;
        });
      });
    });

    // Prepare the response
    const overallPollAnalytics = {
      overallTotalVotes,
      overallOptionCounts
    };

    res.json(overallPollAnalytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = {
  pollRouter
}