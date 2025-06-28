import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Award, RotateCcw } from 'lucide-react';
import { Quiz } from '../types';
import { useCourse } from '../contexts/CourseContext';

interface QuizViewerProps {
  quiz: Quiz;
  courseId: string;
  onBack: () => void;
}

export function QuizViewer({ quiz, courseId, onBack }: QuizViewerProps) {
  const { completeQuiz } = useCourse();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(quiz.completed || false);
  const [quizStarted, setQuizStarted] = useState(quiz.completed || false);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setShowResults(false);
    setSelectedAnswers([]);
    setCurrentQuestion(0);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score and complete quiz
      const correctAnswers = selectedAnswers.filter((answer, index) => 
        answer === quiz.questions[index].correctAnswer
      ).length;
      const score = Math.round((correctAnswers / quiz.questions.length) * 100);
      
      completeQuiz(courseId, quiz.id, score);
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const correctAnswers = selectedAnswers.filter((answer, index) => 
    answer === quiz.questions[index].correctAnswer
  ).length;
  const score = selectedAnswers.length > 0 ? Math.round((correctAnswers / quiz.questions.length) * 100) : 0;

  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to test your knowledge?</h2>
          
          <div className="max-w-md mx-auto mb-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-semibold text-gray-900">{quiz.questions.length}</div>
                <div className="text-gray-600">Questions</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-semibold text-gray-900">~{quiz.questions.length * 2} min</div>
                <div className="text-gray-600">Duration</div>
              </div>
            </div>
          </div>

          {quiz.completed && quiz.score !== undefined && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium">
                Previous Score: {quiz.score}% ({Math.round((quiz.score / 100) * quiz.questions.length)}/{quiz.questions.length} correct)
              </p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleStartQuiz}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center space-x-2"
            >
              <Award className="w-5 h-5" />
              <span>{quiz.completed ? 'Retake Quiz' : 'Start Quiz'}</span>
            </button>
            
            <div>
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Score Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Score: {score}%</h2>
            <p className="text-gray-600">
              You got {correctAnswers} out of {quiz.questions.length} questions correct
            </p>
          </div>

          {/* Question Review */}
          <div className="p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Review Your Answers</h3>
            
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="flex-shrink-0 mt-1">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Question {index + 1}: {question.question}
                        </h4>
                        
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border ${
                                optionIndex === question.correctAnswer
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : optionIndex === userAnswer && !isCorrect
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span>{option}</span>
                                {optionIndex === question.correctAnswer && (
                                  <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                                )}
                                {optionIndex === userAnswer && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                          <p className="text-blue-800 text-sm">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course</span>
          </button>
          
          <button
            onClick={handleStartQuiz}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
        </div>
        
        <div className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {question.question}
        </h2>
        
        <div className="space-y-3 mb-8">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                selectedAnswers[currentQuestion] === index
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  selectedAnswers[currentQuestion] === index
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-400'
                }`}>
                  {selectedAnswers[currentQuestion] === index && (
                    <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                  )}
                </div>
                <span className="font-medium">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestion] === undefined}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentQuestion === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}