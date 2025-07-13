import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, SkipForward } from 'lucide-react';
import { Lecture } from '../types';
import { useCourse } from '../contexts/CourseContext';

interface LectureViewerProps {
  lecture: Lecture;
  courseId: string;
  onBack: () => void;
  onNextLecture: () => void;
}

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? match[1] : null;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function LectureViewer({
  lecture,
  courseId,
  onBack,
  onNextLecture,
}: LectureViewerProps) {
  const { markLectureComplete } = useCourse();
  const playerRef = useRef<HTMLDivElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});

  // Parse lecture content
  let parsedContent: {
    videoUrl: string;
    transcript: string;
    quiz: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[];
  } = {
    videoUrl: '',
    transcript: '',
    quiz: [],
  };

  try {
    parsedContent = JSON.parse(lecture.content);
  } catch (err) {
    console.error('Failed to parse lecture content:', err);
  }

  const videoId = extractYouTubeId(parsedContent?.videoUrl || '');

  useEffect(() => {
    let player: any;

    const loadPlayer = () => {
      if (playerRef.current && window.YT) {
        player = new window.YT.Player(playerRef.current, {
          height: '390',
          width: '640',
          videoId,
          events: {
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                setVideoEnded(true);
              }
            },
          },
        });
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = loadPlayer;
    } else {
      loadPlayer();
    }

    setVideoEnded(false);
    setSelectedOptions({});
    setShowAnswers({});

    return () => {
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, [videoId, lecture.id]);

  const handleMarkComplete = () => {
    if (!lecture.completed && videoEnded) {
      markLectureComplete(courseId, lecture.id);
    }
  };

  const handleOptionSelect = (qIndex: number, optionIndex: number) => {
    setSelectedOptions(prev => ({ ...prev, [qIndex]: optionIndex }));
    setShowAnswers(prev => ({ ...prev, [qIndex]: true }));
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
          disabled={lecture.completed || !videoEnded}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            lecture.completed
              ? 'bg-green-100 text-green-700 cursor-default'
              : videoEnded
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{lecture.completed ? 'Completed' : 'Mark Complete'}</span>
        </button>
      </div>

      {/* Video Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          {videoId ? (
            <div className="aspect-video w-full mb-6">
              <div ref={playerRef} className="w-full h-full rounded-lg" />
            </div>
          ) : (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: lecture.content
                  .replace(/\n\n/g, '</p><p class="mb-4">')
                  .replace(/^(?!<[hup]|<li|<code|<pre)(.+)$/gm, '<p class="mb-4">$1</p>'),
              }}
            />
          )}

          {/* Transcript */}
          {/* {parsedContent.transcript && (
            // <div className="mt-6">
            //   <h2 className="text-xl font-semibold mb-2 text-gray-800">Transcript</h2>
            //   <div className="bg-gray-50 p-4 rounded-lg text-sm leading-relaxed text-gray-700 max-h-64 overflow-y-auto whitespace-pre-wrap">
            //     {parsedContent.transcript}
            //   </div>
            // </div>
          )} */}

          {/* Quiz */}
          {parsedContent.quiz?.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Quiz</h2>
              <div className="space-y-6">
                {parsedContent.quiz.map((q, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                    <p className="font-medium mb-2">
                      {index + 1}. {q.question}
                    </p>
                    <ul className="space-y-2">
                      {q.options.map((option, i) => {
                        const isCorrect = i === q.correctAnswer;
                        const isSelected = selectedOptions[index] === i;
                        const shouldShow = showAnswers[index];

                        let optionStyle = 'border-gray-200';
                        if (shouldShow) {
                          if (isSelected && isCorrect) {
                            optionStyle = 'border-green-500 bg-green-50 text-green-800 font-semibold';
                          } else if (isSelected && !isCorrect) {
                            optionStyle = 'border-red-500 bg-red-50 text-red-800';
                          } else if (isCorrect) {
                            optionStyle = 'border-green-500 bg-green-50 text-green-800';
                          }
                        }

                        return (
                          <li
                            key={i}
                            className={`px-3 py-2 rounded-lg border cursor-pointer transition-colors ${optionStyle}`}
                            onClick={() => !shouldShow && handleOptionSelect(index, i)}
                          >
                            {String.fromCharCode(65 + i)}. {option}
                          </li>
                        );
                      })}
                    </ul>

                    {showAnswers[index] && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course</span>
        </button>

        <div className="flex gap-4">
          {!lecture.completed && (
            <button
              onClick={handleMarkComplete}
              disabled={!videoEnded}
              className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
                videoEnded
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Complete</span>
            </button>
          )}

          <button
            onClick={onNextLecture}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            <span>Next Lecture</span>
          </button>
        </div>
      </div>
    </div>
  );
}
