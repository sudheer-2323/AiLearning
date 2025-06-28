import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Trophy, FileText, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useCourse } from '../contexts/CourseContext';
import { LoadingSpinner } from './LoadingSpinner';
import toast, { Toaster } from 'react-hot-toast';

interface HomePageProps {
  onNavigate: (page: string) => void;
  showLoginToast: boolean;
  isAuthenticated: boolean;
}

export function HomePage({ onNavigate, showLoginToast, isAuthenticated }: HomePageProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { addCourse, setCurrentCourse } = useCourse();

  useEffect(() => {
    if (showLoginToast) {
      toast.success('Login successful');
    }

    if (!isAuthenticated) {
      setUsername(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get('https://ailearning-atyu.onrender.com/api/auth/check', {
          withCredentials: true
        });
        if (res.data?.username) {
          setUsername(res.data.username);
        } else {
          setUsername(null);
        }
      } catch {
        setUsername(null);
      }
    };

    fetchUser();
  }, [showLoginToast, isAuthenticated]);

  const handleGenerateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please enter a course topic');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(
        'https://ailearning-atyu.onrender.com/api/courses',
        { prompt },
        { withCredentials: true }
      );

      const course = response.data;
      addCourse(course);
      setCurrentCourse(course);
      toast.success('Course created successfully');
      onNavigate('course');
      setPrompt('');
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Please log in to generate a course');
        onNavigate('LogIn');
      } else {
        toast.error(error.response?.data?.error || 'Failed to generate course');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    'C++ Programming Course',
    'Python for Beginners',
    'Data Structures and Algorithms',
    'Web Development with React',
    'Machine Learning Basics',
    'Database Design',
  ];

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Toaster />
        <LoadingSpinner message="Generating your personalized course..." />
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Our AI is creating lectures, quizzes, and documentation tailored to your request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <Toaster />
      <div className="text-center mb-16">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">AI-Powered Learning</span>
        </div>

        {username && (
          <h2 className="text-xl text-gray-700 font-medium mb-4">
            Welcome back, <span className="font-semibold">{username}</span>!
          </h2>
        )}

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Learn Anything with
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
            AI-Generated Courses
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
          Simply describe what you want to learn, and our AI will create a comprehensive course
          with structured lectures, interactive quizzes, and detailed documentation.
        </p>

        <form onSubmit={handleGenerateCourse} className="max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Give me a C++ course' or 'Teach me React development'"
                    className="w-full px-6 py-4 text-lg bg-transparent border-none outline-none placeholder-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Course</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-4">Try these popular prompts:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {quickPrompts.map((quickPrompt, index) => (
              <button
                key={index}
                onClick={() => setPrompt(quickPrompt)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {quickPrompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <FeatureCard icon={<BookOpen className="w-8 h-8 text-blue-600" />} title="Structured Lectures" text="AI-generated lectures with clear explanations, code examples, and practical insights." />
        <FeatureCard icon={<Trophy className="w-8 h-8 text-purple-600" />} title="Interactive Quizzes" text="Test your knowledge with AI-generated quizzes that adapt to your learning progress." />
        <FeatureCard icon={<FileText className="w-8 h-8 text-green-600" />} title="Comprehensive Docs" text="Detailed documentation and reference materials to support your learning journey." />
      </div>

      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start learning?</h2>
        <p className="text-lg text-gray-600 mb-8">
          Join thousands of students who are already learning with AI-powered courses.
        </p>
        <button
          onClick={() => onNavigate('courses')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center space-x-2"
        >
          <span>View My Courses</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) {
  return (
    <div className="text-center group">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{text}</p>
    </div>
  );
}
