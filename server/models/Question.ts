import { Schema, model, Types } from 'mongoose';

interface IQuestion {
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const questionSchema = new Schema<IQuestion>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String, required: true },
});

export const Question = model<IQuestion>('Question', questionSchema);