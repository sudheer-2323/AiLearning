// models/User.ts
import { Schema, model, Types } from 'mongoose';

interface IUser {
  username: string;
  password: string;
  courses: Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
});

export const User = model<IUser>('User', userSchema);
