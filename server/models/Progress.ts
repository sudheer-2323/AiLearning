import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' }],
  completedQuizzes: [{ 
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number
  }]
});

export const Progress = mongoose.model('Progress', progressSchema);
