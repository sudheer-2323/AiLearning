import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Documentation } from '../types';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface DocumentationViewerProps {
  documentation: Documentation;
  onBack: () => void;
}

export function DocumentationViewer({ documentation, onBack }: DocumentationViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    try {
      hljs.highlightAll();

      // 🛡️ Safe button-based link rendering
      marked.use({
  renderer: {
    link(href, title, text) {
      console.log(href);
      const hrefStr = typeof href.href === 'string' ? href.href : String(href.href || '');
      console.log(hrefStr);
      const safeHref = hrefStr.startsWith('http') ? hrefStr : `https://${hrefStr}`;
      return `
        <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
          <button class="bg-blue-600 text-white px-4 py-2 my-2 rounded-md hover:bg-blue-700 transition">
            🔗 ${href.text}
          </button>
        </a>
      `;
    }
  }
});


      // 🔎 Markdown parsing and syntax highlighting
      const html = marked.parse(
        (documentation.content || '').replace(/\\n/g, '\n'),
        {
          breaks: true,
          gfm: true,
          highlight: function (code, lang) {
            try {
              if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
              }
              return hljs.highlightAuto(code).value;
            } catch (err) {
              console.error('Highlight error:', err);
              return code;
            }
          }
        }
      );

      setRenderedHtml(html);
    } catch (err) {
      console.error('Markdown render error:', err);
      setHasError(true);
    }
  }, [documentation]);

  if (hasError) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-xl font-bold">Something went wrong.</h2>
        <p>We couldn’t render the documentation. Please try again later.{hasError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
        <div className="p-8 prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
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
