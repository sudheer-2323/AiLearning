import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  FileText,
  CheckCircle,
  Circle,
  Play,
  Clock,
} from 'lucide-react';
import { useCourse } from '../contexts/CourseContext';
import { LectureViewer } from './LectureViewer';
import { QuizViewer } from './QuizViewer';
import { DocumentationViewer } from './DocumentationViewer';

interface CourseViewerProps {
  onNavigate: (page: string) => void;
}

export function CourseViewer({ onNavigate }: CourseViewerProps) {
  const { currentCourse } = useCourse();
  const [activeTab, setActiveTab] = useState<'lectures' | 'quizzes' | 'docs'>('lectures');
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  if (!currentCourse) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">No course selected</h2>
        <button
          onClick={() => onNavigate('courses')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Return to My Courses
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'lectures' as const, label: 'Lectures', icon: BookOpen, count: currentCourse.lectures.length },
    { id: 'quizzes' as const, label: 'Quizzes', icon: Trophy, count: currentCourse.quizzes.length },
    { id: 'docs' as const, label: 'Documentation', icon: FileText, count: currentCourse.documentation.length }
  ];

  const completedLectures = currentCourse.lectures.filter(l => l.completed).length;
  const completedQuizzes = currentCourse.quizzes.filter(q => q.completed).length;

  // Individual viewer screens
  if (selectedLecture) {
    const lecture = currentCourse.lectures.find(l => l.id === selectedLecture);
    if (lecture) {
      return (
        <LectureViewer
          lecture={lecture}
          courseId={currentCourse.id}
          onBack={() => setSelectedLecture(null)}
        />
      );
    }
  }

  if (selectedQuiz) {
    const quiz = currentCourse.quizzes.find(q => q.id === selectedQuiz);
    if (quiz) {
      return (
        <QuizViewer
          quiz={quiz}
          courseId={currentCourse.id}
          onBack={() => setSelectedQuiz(null)}
        />
      );
    }
  }

  if (selectedDoc) {
    const doc = currentCourse.documentation.find(d => d.id === selectedDoc);
    if (doc) {
      return (
        <DocumentationViewer
          documentation={doc}
          onBack={() => setSelectedDoc(null)}
        />
      );
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => onNavigate('courses')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentCourse.title}</h1>
          <p className="text-gray-600">{currentCourse.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
          <span className="text-2xl font-bold text-blue-600">{currentCourse.progress}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${currentCourse.progress}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{completedLectures}/{currentCourse.lectures.length}</div>
            <div className="text-gray-600">Lectures</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{completedQuizzes}/{currentCourse.quizzes.length}</div>
            <div className="text-gray-600">Quizzes</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{currentCourse.documentation.length}</div>
            <div className="text-gray-600">Resources</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 rounded-xl p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content View */}
      <div className="space-y-4">
        {activeTab === 'lectures' && (
          <>
            {currentCourse.lectures.map((lecture, index) => (
              <div
                key={lecture.id || index}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedLecture(lecture.id)}
              >
                <div className="p-6 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {lecture.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{lecture.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{lecture.duration}</span>
                      </div>
                      <span>Lecture {lecture.order}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Play className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'quizzes' && (
          <>
            {currentCourse.quizzes.map((quiz, index) => (
              <div
                key={quiz.id || index}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedQuiz(quiz.id)}
              >
                <div className="p-6 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {quiz.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{quiz.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{quiz.questions.length} questions</span>
                      {quiz.completed && quiz.score !== undefined && (
                        <span className="text-green-600 font-medium">Score: {quiz.score}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Trophy className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'docs' && (
          <>
            {currentCourse.documentation.map((doc, index) => (
              <div
                key={doc.id || index}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedDoc(doc.id)}
              >
                <div className="p-6 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{doc.title}</h3>
                    <div className="text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">{doc.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
