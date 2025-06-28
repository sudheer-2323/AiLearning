import {Schema,model} from 'mongoose';

interface IUser {
  username: string;
  password: string; // Should be hashed in production
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const User = model<IUser>('User', userSchema);