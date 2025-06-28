import { Schema, model, Types } from 'mongoose';

interface ILecture {
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: string;
  duration: string;
  order: number;
}

const lectureSchema = new Schema<ILecture>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  duration: { type: String, required: true },
  order: { type: Number, required: true },
});

export const Lecture = model<ILecture>('Lecture', lectureSchema);