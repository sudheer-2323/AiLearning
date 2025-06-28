import { Schema, model, Types } from 'mongoose';

interface IDocumentation {
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  category: 'Reference' | 'Guidelines';
  order: number;
  content: string;
}

const documentationSchema = new Schema<IDocumentation>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, enum: ['Reference', 'Guidelines'], required: true },
  order: { type: Number, required: true },
  content: { type: String, required: true },
});

export const Documentation = model<IDocumentation>('Documentation', documentationSchema);