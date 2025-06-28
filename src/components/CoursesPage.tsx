import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useCourse } from '../contexts/CourseContext';
import { CourseCard } from './CourseCard';
import { Course } from '../types';

interface CoursesPageProps {
  onNavigate: (page: string) => void;
}

export function CoursesPage({ onNavigate }: CoursesPageProps) {
  const { courses, setCurrentCourse } = useCourse();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredCourses = courses.filter(course =>
    (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCourseClick = (course: Course) => {
    setCurrentCourse(course);
    onNavigate('course');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">
            {courses.length === 0 
              ? 'No courses yet. Create your first AI-generated course!' 
              : `${courses.length} course${courses.length !== 1 ? 's' : ''} in your library`}
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Course</span>
        </button>
      </div>

      {courses.length > 0 && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">Filter</span>
            </button>
          </div>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <CourseCard
                key={course.id ?? course._id ?? index} // <- ensures unique key
                course={course}
                onClick={() => handleCourseClick(course)}
              />
            ))}
          </div>

          {filteredCourses.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or create a new course.
              </p>
            </div>
          )}
        </>
      )}

      {courses.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Start Your Learning Journey</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first AI-generated course by describing what you want to learn. 
            Get personalized lectures, quizzes, and documentation instantly.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Course</span>
          </button>
        </div>
      )}
    </div>
  );
}
