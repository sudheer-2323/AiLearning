// models/Course.ts
import { Schema, model, Types } from 'mongoose';

// Embedded Question Schema
const questionSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: [(opts: string[]) => opts.length === 4, 'Must have 4 options'],
  },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, required: true },
}, { _id: false });

// Embedded Quiz Schema
const quizSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  questions: { type: [questionSchema], default: [] },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: null },
});

// Embedded Lecture Schema
const lectureSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  content: { type: String, required: true }, // JSON stringified object (videoUrl, transcript, quiz)
  duration: { type: String, required: true },
  order: { type: Number, required: true },
  completed: { type: Boolean, default: false },
});

// Embedded Documentation Schema
const documentationSchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Reference', 'Guidelines'], required: true },
  order: { type: Number, required: true },
  content: { type: String, required: true },
});

const courseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  // progress: { type: Number, default: 0 },
  lectures: { type: [lectureSchema], default: [] },
  quizzes: { type: [quizSchema], default: [] },
  documentation: { type: [documentationSchema], default: [] },
}, { timestamps: true });

export const Course = model('Course', courseSchema);
