
// main().catch(console.error);
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { AIService } from './aiService';
import { Course } from './models/Course';
import { Types } from 'mongoose';         // ← ADD THIS
// import { Lecture } from './models/Lecture';
// import { Quiz } from './models/Quiz';
// import { Question } from './models/Question';
// import { Documentation } from './models/Documentation';
import { Progress } from './models/Progress';
// const { tavily } = require('@tavily/core');
// const tvly = tavily({ apiKey: "TRAVILY_API_KEY" });

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

import { User } from './models/User';


app.use(cors({
  origin: ['https://ailearning-2.onrender.com'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
// import Groq from "groq-sdk";
// const groq = new Groq();
// async function main() {
//   const completion = await groq.chat.completions.create({
//     model: "qwen/qwen3-32b",
//     messages: [
//       {
//         role: "user",
//         content: "generte quiz on python basics",
//       },
//     ],
//   });
//   console.log(completion.choices[0]?.message?.content);
// }
// main().catch(console.error);
// const { tavily } = require('@tavily/core');
// const tvly = tavily({ apiKey: process.env.TRVLY_API_KEY });
// tvly.search("DOCUMENTATION ON PYTHON BASICS")
//   .then((results: any) => console.log(results));
interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}
// tvly.search("Who is Leo Messi?")
//   .then(results => console.log(results));

const authenticateToken: RequestHandler = (req: AuthRequest, res, next): void => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }
  try {
    const user = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.user = user;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

app.post('/api/auth/signup', async (req, res) => {
  console.log(req.body);
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

    const token = jwt.sign({ userId: user._id.toString(), username }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    res.status(201).json({ message: 'Signed up successfully', token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

app.post('/api/auth/login', async (req, res) => {
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

    const token = jwt.sign({ userId: user._id.toString(), username }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });

    res.json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.get('/api/auth/check', authenticateToken, (req: AuthRequest, res) => {
  res.json({ isAuthenticated: true, username: req.user?.username });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
});
app.post(
  '/api/courses',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { prompt } = req.body;
    const userId = req.user?.userId;

    if (!prompt || !userId) {
      res.status(400).json({ error: 'Prompt and userId required' });
      return;
    }

    try {
      // AIService handles everything: creation, linking to user, shaping response
      const coursePayload = await AIService.generateAndSaveCourse(prompt, userId);
      res.json(coursePayload);
    } catch (err: any) {
      console.error('Course generation error:', err);
      res
        .status(500)
        .json({ error: err.message || 'Failed to generate course' });
    }
  }
);


//
// 2) List all courses for the logged‐in user
//
app.get(
  '/api/courses',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Pull only the `courses` field
      const user = (await User.findById(userId).lean()) as { courses?: Types.ObjectId[] };
      const courseIds = user?.courses || [];

      // Fetch global courses + user’s progress
      const [courses, progresses] = await Promise.all([
        Course.find({ _id: { $in: courseIds } }).lean(),
        Progress.find({ userId }).lean(),
      ]);

      const detailed = courses.map(course => {
        const prog = progresses.find(p =>
          p.courseId.toString() === course._id!.toString()
        );

        const doneLectures = new Set(
          (prog?.completedLectures || []).map(id => id.toString())
        );
        const doneQuizMap = new Map(
          (prog?.completedQuizzes || []).map(q => [q.quizId!.toString(), q.score])
        );

        const lectures = course.lectures.map(l => ({
          id:        l._id!.toString(),
          title:     l.title,
          content:   l.content,
          duration:  l.duration,
          order:     l.order,
          completed: doneLectures.has(l._id!.toString()),
        }));

        const quizzes = course.quizzes.map(qz => ({
          id:        qz._id!.toString(),
          title:     qz.title,
          completed: doneQuizMap.has(qz._id!.toString()),
          score:     doneQuizMap.get(qz._id!.toString()) ?? 0,
          questions: qz.questions.map(q => ({
            question:      q.question,
            options:       q.options,
            correctAnswer: q.correctAnswer,
            explanation:   q.explanation,
          })),
        }));

        const documentation = course.documentation.map(doc => ({
          id:       doc._id!.toString(),
          title:    doc.title,
          category: doc.category,
          order:    doc.order,
          content:  doc.content,
        }));

        const totalItems = lectures.length + quizzes.length;
        const doneCount  = lectures.filter(l => l.completed).length
                         + quizzes.filter(q => q.completed).length;
        const progressPct = totalItems
          ? parseFloat((doneCount / totalItems).toFixed(2))
          : 0;

        return {
          id:          course._id!.toString(),
          title:       course.title,
          description: course.description,
          progress:    progressPct,
          lectures,
          quizzes,
          documentation,
        };
      });

      res.json(detailed);
      return;
    } catch (err) {
      console.error('Error fetching courses:', err);
      res.status(500).json({ error: 'Failed to fetch courses' });
      return;
    }
  }
);


//
// 3) Mark lecture complete
//
app.post(
  '/api/progress/lecture',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { courseId, lectureId } = req.body;
    const userId = req.user?.userId;

    try {
      let prog = await Progress.findOne({ userId, courseId });
      if (!prog) {
        prog = new Progress({
          userId,
          courseId,
          completedLectures: [],
          completedQuizzes:  [],
        });
      }

      if (!prog.completedLectures.includes(lectureId)) {
        prog.completedLectures.push(lectureId);
      }
      await prog.save();

      res.json({ success: true, progress: prog });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update lecture progress' });
      return;
    }
  }
);


//
// 4) Mark quiz complete
//
app.post(
  '/api/progress/quiz',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { courseId, quizId, score } = req.body;
    const userId = req.user?.userId;

    try {
      let prog = await Progress.findOne({ userId, courseId });
      if (!prog) {
        prog = new Progress({
          userId,
          courseId,
          completedLectures: [],
          completedQuizzes:  [],
        });
      }

      if (!prog.completedQuizzes.some(q => q.quizId!.toString() === quizId)) {
        prog.completedQuizzes.push({ quizId, score });
      }
      await prog.save();

      res.json({ success: true, progress: prog });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update quiz progress' });
      return;
    }
  }
);


//
// 5) Fetch all progress for this user
//
app.get(
  '/api/progress',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const progress = await Progress.find({ userId });
      res.json({ success: true, progress });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch progress' });
      return;
    }
  }
);

app.get('/ping', (req, res) => {
  res.status(200).send('Backend is awake!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
