import React from 'react';
import { Clock, BookOpen, Award, Play } from 'lucide-react';
import { Course } from '../types';
import { Axios } from 'axios';
import axios from 'axios';
import { useState,useEffect} from 'react';

import jsPDF from 'jspdf';


interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  const lectures = Array.isArray(course.lectures) ? course.lectures : [];
  const quizzes = Array.isArray(course.quizzes) ? course.quizzes : [];

  const totalLectures = lectures.length;
  const completedLectures = lectures.filter(l => l?.completed).length;
  const completedQuizzes = quizzes.filter(q => q?.completed).length;
  const [username, setUsername] = useState<string | null>(null);
  

  const totalDuration = lectures.reduce((total, lecture) => {
    const duration = lecture?.duration || '0';
    const minutes = parseInt(duration.split(' ')[0]) || 0;
    return total + minutes;
  }, 0);
 useEffect(() => {
  const fetchUsername = async () => {
    try {
      const res = await axios.get('https://ailearning-atyu.onrender.com/api/auth/check', {
        withCredentials: true
      });
      if (res.data?.username) {
        setUsername(res.data.username);
      }
    } catch (e) {
      console.error(e);
    }
  };

  fetchUsername();
}, []);

  const progress = typeof course.progress === 'number' ? course.progress : 0;
  const createdAt = course.createdAt
    ? new Date(course.createdAt).toLocaleDateString()
    : 'Unknown';
  const handleGenerateCertificate = (title: string, username: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: 'a4'
  });

  // Colors & spacing
  const centerX = 421;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 842, 595, 'F');

  // Decorative border
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(2);
  doc.rect(30, 30, 782, 535);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(40, 70, 130);
  doc.text('Certificate of Completion', centerX, 110, { align: 'center' });

  // Subtitle
  doc.setFontSize(16);
  doc.setTextColor(60);
  doc.text('This is proudly presented to', centerX, 160, { align: 'center' });

  // Name
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(28);
  doc.setTextColor(0);
  doc.text(username || 'Student Name', centerX, 200, { align: 'center' });

  // Achievement text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(80);
  doc.text('for successfully completing the course titled', centerX, 240, { align: 'center' });

  // Course title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 60, 120);
  doc.text(`"${title}"`, centerX, 280, { align: 'center' });

  // Date
  const today = new Date().toLocaleDateString();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(90);
  doc.text(`Issued on ${today}`, 60, 540);

  // Signature
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('__________________________', 700, 510);
  doc.text('Instructor Signature', 700, 535, { align: 'center' });

  // Save
  doc.save(`${username}-${title}-certificate.pdf`);
};


  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {course.title || 'Untitled Course'}
            </h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {course.description || 'No description provided.'}
            </p>
          </div>
          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <BookOpen className="w-4 h-4" />
            <span>{totalLectures} lectures</span>
          </div>
          <div className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>{quizzes.length} quizzes</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{totalDuration} min</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        {progress === 100 && (
  <div className="mt-4 text-center">
    <button
      onClick={(e) => {
        e.stopPropagation(); // prevents triggering onClick for card
        handleGenerateCertificate(course.title, username || 'Student Name');
      }}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm font-medium"
    >
      Download Certificate
    </button>
  </div>
)}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Created {createdAt}
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-green-600 font-medium">
              {completedLectures}/{totalLectures} lectures
            </span>
            <span className="text-blue-600 font-medium">
              {completedQuizzes}/{quizzes.length} quizzes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
