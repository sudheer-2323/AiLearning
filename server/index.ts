import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { AIService } from './aiService'; // Ensure this exports `generateAndSaveCourse`;
import { Course } from './models/Course';
import { Lecture } from '././models/Lecture';
import { Quiz } from './models/Quiz';
import { Question } from './models/Question';
import { Documentation } from './models/Documentation';
import {Progress} from './models/Progress';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors({ origin: 'https://ailearning-2.onrender.com', credentials: true }));
app.use(cookieParser());
app.use(express.json());

interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

// Auth Middleware
const authenticateToken: RequestHandler = (req: AuthRequest, res, next): void => {
  const token = req.cookies.token;
  // console.log(token);

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Signup
app.post('/api/auth/signup', async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // ❗ must be true for SameSite: 'none'
      sameSite: 'none' // ❗ required for cross-origin
    });

    res.status(201).json({ message: 'Signed up successfully', token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

// Login
app.post('/api/auth/login', async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // ❗ must be true for SameSite: 'none'
      sameSite: 'none' // ❗ required for cross-origin
    });
    // console.log(token);

    res.json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Auth Check
app.get('/api/auth/check', authenticateToken, (req: AuthRequest, res): void => {
  res.json({ isAuthenticated: true, username: req.user?.username });
});

// Logout
app.post('/api/auth/logout', (req, res): void => {
  console.log("logout");
  res.clearCookie('token', {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  expires: new Date(0)
});
  res.json({ message: 'Logged out successfully' });
});

// Protected Course Generation
app.post('/api/courses', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  const { prompt } = req.body;
  const userId = req.user?.userId;

  if (!prompt || !userId) {
    res.status(400).json({ error: 'Prompt and userId required' });
    return;
  }

  try {
    const course = await AIService.generateAndSaveCourse(prompt, userId);
    // console.log("generated course:", course)
    res.json(course);
  } catch (error: any) {
    console.error('Course generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate course' });
  }
});
// Get all courses for the logged-in user
app.get('/api/courses', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const courses = await Course.find({ userId });

    const detailedCourses = await Promise.all(courses.map(async (course) => {
      const lecturesRaw = await Lecture.find({ courseId: course._id });
      const quizzesRaw = await Quiz.find({ courseId: course._id });
      const docsRaw = await Documentation.find({ courseId: course._id });

      const lectures = lecturesRaw.map(l => ({
        id: l._id.toString(),
        title: l.title,
        content: l.content,
        duration: l.duration,
        order: l.order,
        completed: false, // set dynamically on frontend
      }));

      const quizzes = await Promise.all(
        quizzesRaw.map(async (quiz) => {
          const questions = await Question.find({ quizId: quiz._id });
          return {
            id: quiz._id.toString(),
            title: quiz.title,
            completed: false, // set dynamically on frontend
            score: 0, // default
            questions: questions.map(q => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation
            }))
          };
        })
      );

      const documentation = docsRaw.map(doc => ({
        id: doc._id.toString(),
        title: doc.title,
        category: doc.category,
        order: doc.order,
        content: doc.content
      }));

      return {
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        // createdAt: course.createdAt,
        progress: 0, // initialize, calculate on frontend
        lectures,
        quizzes,
        documentation
      };
    }));

    res.json(detailedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});
// routes/progress.ts
app.post('/api/progress/lecture', authenticateToken, async (req: AuthRequest, res) => {
  console.log("sudheer")
  const { courseId, lectureId } = req.body;
  console.log(lectureId);
  const userId = req.user?.userId;

  try {
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      progress = new Progress({ userId, courseId, completedLectures: [] });
    }

    if (!progress.completedLectures.includes(lectureId)) {
      progress.completedLectures.push(lectureId);
    }

    await progress.save();
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lecture progress' });
  }
});

app.post('/api/progress/quiz', authenticateToken, async (req: AuthRequest, res) => {
  const { courseId, quizId, score } = req.body;
  const userId = req.user?.userId;

  try {
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      progress = new Progress({ userId, courseId, completedQuizzes: [] });
    }

  const existing = progress.completedQuizzes.find(q => {
    if (!q.quizId) return false;
      return q.quizId.toString() === quizId;
    });   
     if (!existing) {
      progress.completedQuizzes.push({ quizId, score });
    }

    await progress.save();
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quiz progress' });
  }
});
app.get('/api/progress', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const progress = await Progress.find({ userId });
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});
app.get('/ping', (req, res) => {
  res.status(200).send('Backend is awake!');
});



// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
