// import { Course, Lecture, Quiz, Documentation } from '../types';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// // import dotenv from 'dotenv';

// // Load environment variables
// // dotenv.config();

// const GEMINI_API_KEY = "AIzaSyDVGNuqKE0Zcoa3hDZk1U5cZ8yNHeW5UtU";
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// // In-memory cache to reduce API calls
// const cache = new Map<string, Course>();

// // Utility function to clean Markdown and extract JSON
// function cleanJsonResponse(text: string): string {
//   return text
//     .replace(/```json\s*\n|```/g, '') // Remove ```json and closing ```
//     .replace(/^\s*|\s*$/g, '') // Trim leading/trailing whitespace
//     .replace(/\n\s*/g, ''); // Remove newlines and surrounding whitespace
// }

// // Utility function for retrying API calls
// async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delayMs: number = 5000): Promise<T> {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (error.status === 503 && attempt < retries) {
//         console.warn(`Attempt ${attempt} failed with 503 error. Retrying in ${delayMs}ms...`);
//         await new Promise(resolve => setTimeout(resolve, delayMs));
//         continue;
//       }
//       throw error; // Rethrow if not 503 or out of retries
//     }
//   }
//   throw new Error('Max retries reached');
// }

// export class AIService {
//   static async generateCourse(prompt: string): Promise<Course> {
//     // Check cache first
//     if (cache.has(prompt)) {
//       console.debug(`Returning cached course for prompt: ${prompt}`);
//       return cache.get(prompt)!;
//     }

//     const courseId = Math.random().toString(36).substr(2, 9);
//     const now = new Date();

//     try {
//       // Generate all course components in a single API call
//       const result = await withRetry(() =>
//         model.generateContent({
//           contents: [
//             {
//               role: 'user',
//               parts: [
//                 {
//                   text: `Generate a complete course for the topic: "${prompt}". Include:
//                   - Course metadata (title, description)
//                   - complete number of lectures (title, Markdown content with code examples if relevant, duration, order)
//                   - 1 quiz with 15 multiple-choice questions (title, questions with text, 4 options, correct answer index, explanation)
//                   - complete documentation entries (title, category as "Reference" or "Guidelines", order, Markdown content)
//                   Return the response as raw JSON without any Markdown, backticks, or code fences:
//                   {
//                     "title": "Course Title",
//                     "description": "Course Description",
//                     "lectures": [
//                       {
//                         "title": "Lecture Title",
//                         "content": "# Lecture Title\n\nContent here...",
//                         "duration": "30 min",
//                         "order": 1
//                       }
//                     ],
//                     "quizzes": [
//                       {
//                         "title": "Quiz Title",
//                         "questions": [
//                           {
//                             "question": "Question text",
//                             "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
//                             "correctAnswer": 0,
//                             "explanation": "Explanation here"
//                           }
//                         ]
//                       }
//                     ],
//                     "documentation": [
//                       {
//                         "title": "Doc Title",
//                         "category": "Reference",
//                         "order": 1,
//                         "content": "# Doc Title\n\nContent here..."
//                       }
//                     ]
//                   }`,
//                 },
//               ],
//             },
//           ],
//           generationConfig: { maxOutputTokens: 4000, temperature: 0.7 },
//         })
//       );

//       const rawText = result.response.text();
//       const cleanedText = cleanJsonResponse(rawText);
//       console.debug('Cleaned course response:', cleanedText);

//       const content = JSON.parse(cleanedText);

//       const course: Course = {
//         id: courseId,
//         title: content.title || `Complete ${prompt} Course`,
//         description: content.description || `A comprehensive course on ${prompt}.`,
//         prompt,
//         createdAt: now,
//         progress: 0,
//         lectures: (content.lectures || []).map((lecture: any, index: number) => ({
//           id: `${index + 1}`,
//           title: lecture.title || `Lecture ${index + 1}`,
//           content: lecture.content || `# ${lecture.title}\n\nContent not available.`,
//           duration: lecture.duration || '30 min',
//           order: lecture.order || index + 1,
//           completed: false,
//         })),
//         quizzes: (content.quizzes || []).map((quiz: any, index: number) => ({
//           id: `${index + 1}`,
//           title: quiz.title || `${prompt} Fundamentals Quiz`,
//           completed: false,
//           questions: (quiz.questions || []).map((q: any, qIndex: number) => ({
//             id: `${qIndex + 1}`,
//             question: q.question || 'Question not available',
//             options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
//             correctAnswer: q.correctAnswer ?? 0,
//             explanation: q.explanation || 'Explanation not available',
//           })),
//         })),
//         documentation: (content.documentation || []).map((doc: any, index: number) => ({
//           id: `${index + 1}`,
//           title: doc.title || `Documentation ${index + 1}`,
//           category: doc.category || 'Reference',
//           order: doc.order || index + 1,
//           content: doc.content || `# ${doc.title}\n\nContent not available.`,
//         })),
//       };

//       // Cache the course
//       cache.set(prompt, course);
//       return course;
//     } catch (error) {
//       console.error('Error generating course:', error, 'Raw response:', error.response?.text || 'No response');
//       if (error.status === 429 || error.status === 503) {
//         throw new Error('Gemini API is temporarily unavailable (overloaded or rate limit exceeded). Please try again later.');
//       }
//       throw new Error('Failed to generate course. Please try again.');
//     }
//   }
// }