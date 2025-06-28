import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Lecture } from '././models/Lecture';
import { Quiz } from './models/Quiz';
import { Question } from './models/Question';
import { Documentation } from './models/Documentation';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json\s*\n|```/g, '')
    .replace(/^\s*|\s*$/g, '')
    .replace(/\n\s*/g, '');
}

async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delayMs: number = 5000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.warn(`Attempt ${attempt} failed:`, error);
      if (error.status === 503 && attempt < retries) {
        console.warn(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      if (error.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

export class AIService {
  static async generateAndSaveCourse(prompt: string, userId: string): Promise<any> {
    try {
      const result = await withRetry(() =>
        model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Generate a complete course for the topic: "${prompt}". Include:
- Course metadata (title, description)
- complete number of lectures (title, Markdown content with important code examples, duration, order)
- 1 quiz with 15 multiple-choice hard questions (title, questions with 4 options, correctAnswer index, explanation)
- documentation (title, category: Reference or Guidelines, order, content in Markdown)
Return as raw JSON:
{
  "title": "...",
  "description": "...",
  "lectures": [...],
  "quizzes": [...],
  "documentation": [...]
}`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
        })
      );

      const rawText = result.response.text();
      const cleanedText = cleanJsonResponse(rawText);
      const courseData = JSON.parse(cleanedText);

      const course = new Course({
        userId,
        title: courseData.title || `Complete ${prompt} Course`,
        description: courseData.description || `A comprehensive course on ${prompt}`,
      });
      const savedCourse = await course.save();

      const savedLectures = await Lecture.insertMany(
        (courseData.lectures || []).map((lecture: any, i: number) => ({
          courseId: savedCourse._id,
          userId,
          title: lecture.title || `Lecture ${i + 1}`,
          content: lecture.content || '',
          duration: lecture.duration || '30 min',
          order: lecture.order || i + 1,
        }))
      );
      const lecturesWithIds = savedLectures.map(l => ({ ...l.toObject(), id: l._id.toString(), completed: false }));

      const quizzes = await Promise.all(
        (courseData.quizzes || []).map(async (quiz: any) => {
          const newQuiz = new Quiz({
            courseId: savedCourse._id,
            userId,
            title: quiz.title || 'Course Quiz',
          });
          const savedQuiz = await newQuiz.save();

          const savedQuestions = await Question.insertMany(
            (quiz.questions || []).map((question: any, i: number) => ({
              quizId: savedQuiz._id,
              userId,
              question: question.question || `Question ${i + 1}`,
              options: question.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: question.correctAnswer || 0,
              explanation: question.explanation || 'No explanation provided.',
            }))
          );

          return {
            ...savedQuiz.toObject(),
            id: savedQuiz._id.toString(),
            questions: savedQuestions,
            completed: false,
            score: null,
          };
        })
      );

      const savedDocumentation = await Documentation.insertMany(
        (courseData.documentation || []).map((doc: any, i: number) => ({
          courseId: savedCourse._id,
          userId,
          title: doc.title || `Doc ${i + 1}`,
          category: doc.category || 'Reference',
          order: doc.order || i + 1,
          content: doc.content || '',
        }))
      );
      const docsWithIds = savedDocumentation.map(d => ({ ...d.toObject(), id: d._id.toString() }));

      return {
        id: savedCourse._id.toString(),
        title: savedCourse.title,
        description: savedCourse.description,
        progress: 0,
        lectures: lecturesWithIds,
        quizzes,
        documentation: docsWithIds,
      };
    } catch (error: any) {
      console.error('Error generating and saving course:', error);
      throw new Error(error.message || 'Failed to generate and save course content.');
    }
  }
}
