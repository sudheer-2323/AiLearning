import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
const { getTranscript } = require('youtube-transcript');

import { User } from './models/User';
import { Course } from './models/Course';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const { tavily } = require('@tavily/core');
const tvly = tavily({ apiKey: process.env.TRVLY_API_KEY });

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY || '',
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function cleanJsonResponse(text: string): string {
  const firstBraceIndex = text.indexOf('{');
  if (firstBraceIndex === -1) throw new Error('No JSON object found in the response');
  return text.slice(firstBraceIndex).replace(/```json|```/g, '').trim();
}

function convertISO8601Duration(isoDuration: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const [, hours, minutes, seconds] = regex.exec(isoDuration) || [];
  const h = hours ? `${hours}h ` : '';
  const m = minutes ? `${minutes}m ` : '';
  const s = seconds ? `${seconds}s` : '';
  return `${h}${m}${s}`.trim() || '0s';
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 5000): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      if (error.status === 503 && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

async function findYouTubePlaylistId(prompt: string): Promise<string | undefined> {
  const res = await withRetry(() =>
    youtube.search.list({
      q: `${prompt} playlist`,
      part: ['snippet'],
      type: ['playlist'],
      maxResults: 5,
    })
  );
  const id = res.data.items?.[0]?.id?.playlistId;
  return id ?? undefined;
}

async function fetchYouTubePlaylistVideos(playlistId: string): Promise<{ title: string; url: string; duration: string }[]> {
  const videos: { title: string; url: string; duration: string }[] = [];
  let nextPageToken: string | undefined;

  do {
    const playlistRes = await withRetry(() =>
      youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults: 25,
        pageToken: nextPageToken,
      })
    );

    const items = playlistRes.data.items || [];
    const videoIds = items.map(item => item.contentDetails?.videoId).filter(Boolean) as string[];

    const videoRes = await withRetry(() =>
      youtube.videos.list({
        part: ['contentDetails'],
        id: videoIds,
        maxResults: 25,
      })
    );

    const videoDurations = new Map<string, string>();
    videoRes.data.items?.forEach(video => {
      if (video.id && video.contentDetails?.duration) {
        videoDurations.set(video.id, convertISO8601Duration(video.contentDetails.duration));
      }
    });

    items.forEach((item, index) => {
      const videoId = item.contentDetails?.videoId;
      if (videoId) {
        videos.push({
          title: item.snippet?.title || `Video ${index + 1}`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          duration: videoDurations.get(videoId) || 'Unknown',
        });
      }
    });

    nextPageToken = playlistRes.data.nextPageToken || undefined;
  } while (nextPageToken);

  return videos;
}

export function extractValidJsonBlock(text: string): any {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) throw new Error('Could not locate valid JSON block in AI response.');

  const rawJson = cleaned.slice(jsonStart, jsonEnd + 1);

  try {
    const safeJson = rawJson
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\r\n]+/g, ' ')
      .replace(/“|”/g, '"');

    return JSON.parse(safeJson);
  } catch (err) {
    console.error(' Failed to parse JSON block:\n', rawJson);
    throw new Error('AI returned invalid JSON format.');
  }
}

export class AIService {
  static async generateAndSaveCourse(prompt: string, userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const userMatch = await Course.findOne({
        $or: [
          { title: { $regex: `\\b${prompt}\\b`, $options: 'i' } },
          { description: { $regex: `\\b${prompt}\\b`, $options: 'i' } },
      ],
        _id: { $in: user.courses }
        });


      if (userMatch) {
        return {
          status: 'already_exists',
          message: 'Course already exists for this topic.',
        };
      }

      const globalCourse = await Course.findOne({
       $or: [
          { title: { $regex: `\\b${prompt}\\b`, $options: 'i' } },
          { description: { $regex: `\\b${prompt}\\b`, $options: 'i' } },
      ],
      });

      if (globalCourse) {
        user.courses.push(globalCourse._id);
        await user.save();

        return {
          id: globalCourse._id.toString(),
          title: globalCourse.title,
          description: globalCourse.description,
          progress: 0,
          lectures: globalCourse.lectures.map(l => ({
            id: l._id!.toString(),
            ...l.toObject(),
            completed: false,
          })),
          quizzes: globalCourse.quizzes.map(qz => ({
            id: qz._id!.toString(),
            ...qz.toObject(),
            completed: false,
            score: null,
          })),
          documentation: globalCourse.documentation.map(d => ({
            id: d._id!.toString(),
            ...d.toObject(),
          })),
        };
      }

      const groqPrompt = `Generate a course for: "${prompt}".

Return only raw JSON in this exact format:

{
  "title": "Course Title",
  "description": "Course Description",
  "quiz": {
    "title": "Course Quiz",
    "questions": [
      {
        "question": "Your question here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Explanation for the correct answer"
      },
      ...
      // Repeat until you have 15 such questions
    ]
  },
  "documentation": {
    "title": "Documentation Title",
    "content": "Markdown formatted documentation with at least 300 words"
  }
}

IMPORTANT:
- Make sure the quiz has **exactly 15** multiple-choice questions.
- Each question must have **4 non-empty options**, a valid **correctAnswer (0-based index)**, and an **explanation**.
- Do not include any non-JSON text.`;


      const completion = await withRetry(() =>
        groq.chat.completions.create({
          model: "qwen/qwen3-32b",
          messages: [{ role: "user", content: groqPrompt }],
        })
      );

      const courseData = extractValidJsonBlock(completion.choices[0]?.message?.content || '');
      const playlistId = await findYouTubePlaylistId(prompt);
      const videoLectures = playlistId ? await fetchYouTubePlaylistVideos(playlistId) : [];

      const lectures: any[] = [];
      for (const [i, video] of videoLectures.entries()) {
        const videoId = video.url.split('v=')[1];
        let transcriptText = '';
        try {
          const transcriptArr = await getTranscript(videoId);
          transcriptText = transcriptArr.map((t: { text: string }) => t.text).join(' ');
        } catch {
          transcriptText = 'Transcript not available.';
        }

        let embeddedQuiz = [];
        if ((i + 1) % 10 === 0 || i === videoLectures.length - 1) {
          const quizPrompt = `Generate 5 multiple-choice questions with 4 options each based on this YouTube video description.
Video Title: "${video.title}"
Video Description: "${(video as any).description || 'No description provided'}"
Respond ONLY with JSON like:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "..."
    }
  ]
}`;
          try {
            const quizGen = await groq.chat.completions.create({
              model: "qwen/qwen3-32b",
              messages: [{ role: "user", content: quizPrompt }],
            });
            embeddedQuiz = JSON.parse(cleanJsonResponse(quizGen.choices[0]?.message?.content || '')).questions || [];
          } catch (err) {
            console.warn(`Quiz generation failed for ${video.url}:`, err);
          }
        }

        lectures.push({
          title: video.title || `Lecture ${i + 1}`,
          content: JSON.stringify({ videoUrl: video.url, transcript: transcriptText, quiz: embeddedQuiz }),
          duration: video.duration || 'Unknown',
          order: i + 1,
          completed: false,
        });
      }

      const quizzes: any[] = [];

if (courseData.quiz) {
  const quiz = courseData.quiz;
  const title = quiz.title || `Course Quiz`;
  const questions: any[] = [];

  for (const q of quiz.questions || []) {
    if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') continue;
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((opt: string) => typeof opt !== 'string' || !opt.trim())) continue;
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) continue;

    questions.push({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'No explanation provided.',
    });
  }

  quizzes.push({
    title,
    questions,
    completed: false,
    score: null,
  });
}

      let documentationContent = '';
      try {
        const tavilyResponse = await tvly.search(`Documentation on ${prompt}`, {
          max_results: 5,
          include_raw_content: true,
        });

        documentationContent = tavilyResponse.results
          .map((result: any) => `### [${result.title || 'Source'}](${result.url})\n\n${result.content || ''}\n`)
          .join('\n');

        if (!documentationContent) {
          documentationContent = `No documentation content found for "${prompt}".`;
        }
      } catch (err) {
        console.warn('Tavily search failed:', err);
        documentationContent = `Failed to fetch documentation for "${prompt}".`;
      }

      const documentation = [{
        title: `${prompt} Documentation`,
        category: 'Reference',
        order: 1,
        content: documentationContent || 'No documentation available.',
      }];

      const savedCourse = await Course.create({
        title: courseData.title || `Complete ${prompt} Course`,
        description: courseData.description || `A comprehensive course on ${prompt}`,
        lectures,
        quizzes,
        documentation,
      });

      await User.findByIdAndUpdate(userId, {
        $addToSet: { courses: savedCourse._id },
      });

      return {
  id: savedCourse._id.toString(),
  title: savedCourse.title,
  description: savedCourse.description,
  progress: 0,
  lectures: savedCourse.lectures.map((l: any) => ({
    id: l._id?.toString(),
    ...l.toObject?.() || l,
    completed: false,
  })),
  quizzes: savedCourse.quizzes.map((q: any) => ({
    id: q._id?.toString(),
    ...q.toObject?.() || q,
    completed: false,
    score: null,
  })),
  documentation: savedCourse.documentation.map((d: any) => ({
    id: d._id?.toString(),
    ...d.toObject?.() || d,
  })),
};
    } catch (error: any) {
      console.error('Error generating and saving course:', error.message, error.stack);
      throw new Error(`Failed to generate and save course: ${error.message}`);
    }
  }
}
