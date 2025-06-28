import { Schema, model, Types } from 'mongoose';

interface ICourse {
  userId: Types.ObjectId;
  title: string;
  description: string;
  progress:number;
}

const courseSchema = new Schema<ICourse>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

export const Course = model<ICourse>('Course', courseSchema);