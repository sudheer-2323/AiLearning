import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Documentation } from '../types';

interface DocumentationViewerProps {
  documentation: Documentation;
  onBack: () => void;
}

export function DocumentationViewer({ documentation, onBack }: DocumentationViewerProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{documentation.title}</h1>
          <div className="text-sm text-gray-500 mt-1">
            <span className="bg-gray-100 px-2 py-1 rounded-full">{documentation.category}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: documentation.content
                .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-6">$1</h1>')
                .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold text-gray-800 mb-4 mt-8">$2</h2>')
                .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium text-gray-700 mb-3 mt-6">$3</h3>')
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
      <div className="mt-8">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course</span>
        </button>
      </div>
    </div>
  );
}