import React from 'react';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { Lecture } from '../types';
import { useCourse } from '../contexts/CourseContext';

interface LectureViewerProps {
  lecture: Lecture;
  courseId: string;
  onBack: () => void;
}

export function LectureViewer({ lecture, courseId, onBack }: LectureViewerProps) {
  const { markLectureComplete } = useCourse();

  const handleMarkComplete = () => {
    if (!lecture.completed) {
      markLectureComplete(courseId, lecture.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{lecture.duration}</span>
              </div>
              <span>Lecture {lecture.order}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleMarkComplete}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            lecture.completed
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={lecture.completed}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{lecture.completed ? 'Completed' : 'Mark Complete'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: lecture.content
                .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-6">$1</h1>')
                .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold text-gray-800 mb-4 mt-8">$1</h2>')
                .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium text-gray-700 mb-3 mt-6">$1</h3>')
                .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-4 overflow-x-auto mb-4"><code class="language-$1">$2</code></pre>')
                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
                .replace(/^- (.+)$/gm, '<li class="mb-2">$1</li>')
                .replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside mb-4">$1</ul>')
                .replace(/\n\n/g, '</p><p class="mb-4">')
                .replace(/^(?!<[hup]|<li|<code|<pre)(.+)$/gm, '<p class="mb-4">$1</p>')
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course</span>
        </button>
        
        {!lecture.completed && (
          <button
            onClick={handleMarkComplete}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark as Complete</span>
          </button>
        )}
      </div>
    </div>
  );
}