import React from 'react';
import { JournalEntry } from '../types';
import { Button } from './Button';

interface JournalListProps {
  entries: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const JournalList: React.FC<JournalListProps> = ({ entries, onEdit, onDelete, onCreate }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Your Journal</h1>
          <p className="text-slate-500 mt-1">Reflect on your days, secure and private.</p>
        </div>
        <Button onClick={onCreate} className="w-full md:w-auto">
          <span className="mr-2">+</span> New Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-xl font-semibold text-slate-700">No entries yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Start documenting your journey today. Your future self will thank you.</p>
          <Button onClick={onCreate}>Write your first entry</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map(entry => (
            <div 
              key={entry.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group"
              onClick={() => onEdit(entry)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {entry.analysis?.moodEmoji && (
                  <span className="text-xl" title={entry.analysis.sentiment}>{entry.analysis.moodEmoji}</span>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1">{entry.title || 'Untitled'}</h3>
              <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow">{entry.content}</p>

              {entry.analysis?.tags && entry.analysis.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {entry.analysis.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
