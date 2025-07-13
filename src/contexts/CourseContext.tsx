import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Course } from '../types';

interface CourseContextType {
  courses: Course[];
  currentCourse: Course | null;
  addCourse: (course: Course) => void;
  setCurrentCourse: (course: Course | null) => void;
  updateCourseProgress: (courseId: string, progress: number) => void;
  markLectureComplete: (courseId: string, lectureId: string) => Promise<void>;
  completeQuiz: (courseId: string, quizId: string, score: number) => void;
  fetchCourses: () => Promise<void>;
  onNavigate: (page: string) => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

interface CourseProviderProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
}

export function CourseProvider({ children, onNavigate, isAuthenticated }: CourseProviderProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      console.log(' Fetching courses');
      const [coursesRes, progressRes] = await Promise.all([
        axios.get<Course[]>('https://ailearning-2.onrender.com/api/courses', { withCredentials: true }),
        axios.get('https://ailearning-2.onrender.com/api/progress', { withCredentials: true }),
      ]);

      const courses = coursesRes.data;
      const progressList = progressRes.data.progress;

      const updatedCourses = courses.map(course => {
        const progressEntry = progressList.find((p: any) => p.courseId === course.id);
        const completedLectures = progressEntry?.completedLectures || [];
        const completedQuizzes = progressEntry?.completedQuizzes || [];

        const lectures = course.lectures.map(lecture => ({
          ...lecture,
          completed: completedLectures.includes(lecture.id),
        }));

        const quizzes = course.quizzes.map(quiz => {
          const completedQuiz = completedQuizzes.find((q: any) => q.quizId === quiz.id);
          return completedQuiz
            ? { ...quiz, completed: true, score: completedQuiz.score }
            : { ...quiz, completed: false };
        });

        const completedCount = lectures.filter(l => l.completed).length;
        const progressPercentage =
          lectures.length > 0 ? (completedCount / lectures.length) * 100 : 0;

        return {
          ...course,
          lectures,
          quizzes,
          progress: progressPercentage,
        };
      });

      setCourses(updatedCourses);
      console.log(' Courses + progress applied:', updatedCourses);
    } catch (err: any) {
      console.error(' Failed to load courses:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Please log in to view courses');
        onNavigate('LogIn');
      } else {
        toast.error('Failed to load courses');
      }
    }
  };

  useEffect(() => {
  if (isAuthenticated) {
    fetchCourses();
  } else {
    // 🧹 Clear state when logged out
    setCourses([]);
    setCurrentCourse(null);
  }
}, [isAuthenticated]);

  const addCourse = (course: Course) => {
    setCourses(prev => [...prev, course]);
  };

  const updateCourseProgress = (courseId: string, progress: number) => {
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId ? { ...course, progress } : course
      )
    );
    if (currentCourse?.id === courseId) {
      setCurrentCourse(prev => (prev ? { ...prev, progress } : prev));
    }
  };

  const markLectureComplete = async (courseId: string, lectureId: string) => {
    try {
      console.log(' Sending lecture completion request:', { courseId, lectureId });

      const response = await axios.post(
        'https://ailearning-2.onrender.com/api/progress/lecture',
        { courseId, lectureId },
        { withCredentials: true }
      );

      console.log(' Progress update response:', response.data);
      const { progress } = response.data;

      const course = courses.find(c => c.id === courseId);
      const totalLectures = course?.lectures.length || 0;
      const completedLectures = progress?.completedLectures?.length || 0;
      const progressPercentage = totalLectures > 0
        ? (completedLectures / totalLectures) * 100
        : 0;

      setCourses(prev =>
        prev.map(course => {
          if (course.id === courseId) {
            const updatedLectures = course.lectures.map(lecture =>
              lecture.id === lectureId ? { ...lecture, completed: true } : lecture
            );
            return { ...course, lectures: updatedLectures, progress: progressPercentage };
          }
          return course;
        })
      );

      if (currentCourse?.id === courseId) {
        setCurrentCourse(prev => {
          if (!prev) return prev;
          const updatedLectures = prev.lectures.map(lecture =>
            lecture.id === lectureId ? { ...lecture, completed: true } : lecture
          );
          return { ...prev, lectures: updatedLectures, progress: progressPercentage };
        });
      }

      toast.success(`Lecture completed! Progress: ${progressPercentage.toFixed(1)}%`);
    } catch (error: any) {
      console.error(' Failed to track lecture progress:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Please log in to update progress');
        onNavigate('LogIn');
      } else {
        toast.error(error.response?.data?.error || 'Failed to track lecture progress');
      }
    }
  };

  const completeQuiz = async (courseId: string, quizId: string, score: number) => {
    try {
      console.log(' Sending quiz completion request:', { courseId, quizId, score });
      await axios.post(
        'https://ailearning-2.onrender.com/api/progress/quiz',
        { courseId, quizId, score },
        { withCredentials: true }
      );

      setCourses(prev =>
        prev.map(course => {
          if (course.id === courseId) {
            const updatedQuizzes = course.quizzes.map(quiz =>
              quiz.id === quizId ? { ...quiz, completed: true, score } : quiz
            );
            return { ...course, quizzes: updatedQuizzes };
          }
          return course;
        })
      );

      if (currentCourse?.id === courseId) {
        setCurrentCourse(prev => {
          if (!prev) return prev;
          const updatedQuizzes = prev.quizzes.map(quiz =>
            quiz.id === quizId ? { ...quiz, completed: true, score } : quiz
          );
          return { ...prev, quizzes: updatedQuizzes };
        });
      }

      toast.success('Quiz completed!');
    } catch (error: any) {
      console.error(' Failed to track quiz progress:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Please log in to complete quiz');
        onNavigate('LogIn');
      } else {
        toast.error(error.response?.data?.error || 'Failed to complete quiz');
      }
    }
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        currentCourse,
        addCourse,
        setCurrentCourse,
        updateCourseProgress,
        markLectureComplete,
        completeQuiz,
        fetchCourses,
        onNavigate,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
