import { Schema, model, Types } from 'mongoose';

interface IQuiz {
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
}

const quizSchema = new Schema<IQuiz>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
});

export const Quiz = model<IQuiz>('Quiz', quizSchema);