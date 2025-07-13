import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLectures: [{ type: mongoose.Schema.Types.ObjectId }], // embedded lecture _id
  completedQuizzes: [{
    quizId: { type: mongoose.Schema.Types.ObjectId }, // embedded quiz _id
    score: Number,
  }],
}, { timestamps: true });

export const Progress = mongoose.model('Progress', progressSchema);
