import React, { useState, useEffect } from 'react';
import { JournalEntry, AIAnalysis } from '../types';
import { analyzeJournalEntry } from '../services/geminiService';
import { Button } from './Button';

interface JournalEditorProps {
  initialEntry?: JournalEntry | null;
  onSave: (entry: Partial<JournalEntry>) => void;
  onCancel: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({ initialEntry, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [date, setDate] = useState(initialEntry?.date ? new Date(initialEntry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | undefined>(initialEntry?.analysis);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!content.trim()) {
      setError("Content cannot be empty.");
      return;
    }
    onSave({
      id: initialEntry?.id,
      title,
      content,
      date,
      analysis
    });
  };

  const handleAnalyze = async () => {
    if (content.length < 20) {
      setError("Please write a bit more before asking for AI analysis.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeJournalEntry(content);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to analyze entry. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white md:rounded-2xl md:shadow-lg md:border md:border-slate-100 min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={onCancel} className="text-sm">
          ← Back
        </Button>
        <div className="flex gap-2">
          {!analysis && content.length > 20 && (
            <Button 
              variant="secondary" 
              onClick={handleAnalyze} 
              isLoading={isAnalyzing}
              className="text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100"
            >
              ✨ AI Reflect
            </Button>
          )}
          <Button onClick={handleSave}>Save Entry</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {/* Editor Inputs */}
      <div className="space-y-4 flex-grow flex flex-col">
        <div className="flex flex-col md:flex-row gap-4">
           <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-grow p-2 border border-slate-200 rounded-lg font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <textarea
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full flex-grow p-4 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 leading-relaxed text-lg min-h-[300px]"
        />
      </div>

      {/* Analysis Result Card */}
      {analysis && (
        <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100 animate-fade-in">
          <div className="flex justify-between items-start mb-3">
             <h4 className="text-indigo-900 font-semibold flex items-center gap-2">
               ✨ AI Reflection
             </h4>
             <span className="text-2xl" title="Mood">{analysis.moodEmoji}</span>
          </div>
          
          <p className="text-indigo-800 text-sm mb-4 italic">"{analysis.summary}"</p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Sentiment</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${analysis.sentimentScore > 0 ? 'bg-green-400' : analysis.sentimentScore < 0 ? 'bg-red-400' : 'bg-slate-400'}`} 
                    style={{ width: `${Math.abs(analysis.sentimentScore) * 100}%` }} // Simplified visual representation
                  ></div>
                </div>
                <span className="text-xs text-slate-600 font-medium">{analysis.sentiment}</span>
              </div>
            </div>
            
            <div>
               <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Suggestion</span>
               <p className="text-sm text-slate-700 mt-1">{analysis.advice}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {analysis.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-white text-indigo-600 text-xs rounded-md shadow-sm border border-indigo-50">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
