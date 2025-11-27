import React, { useState } from 'react';
import { generateLevel } from '../services/geminiService';
import { DEFAULT_LEVEL_PROMPT } from '../constants';
import { Level } from '../types';

interface LevelGeneratorProps {
  onLevelGenerated: (level: Level) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LevelGenerator: React.FC<LevelGeneratorProps> = ({ onLevelGenerated, isLoading, setIsLoading }) => {
  const [prompt, setPrompt] = useState(DEFAULT_LEVEL_PROMPT);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const level = await generateLevel(prompt);
      onLevelGenerated(level);
    } catch (err) {
      console.error(err);
      setError("Failed to generate level. Please check your API Key.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
        AI Level Architect
      </h2>
      <p className="text-slate-400 text-sm mb-4 text-center">
        Describe a level (e.g., "Hard level with lots of spikes" or "Slow practice track") and Gemini will build it.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all resize-none h-24"
            disabled={isLoading}
          />
        </div>
        
        {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded">
                {error}
            </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-bold text-lg uppercase tracking-wider transition-all
            ${isLoading 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-95'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Building...
            </span>
          ) : 'Generate Level'}
        </button>
      </form>
    </div>
  );
};

export default LevelGenerator;
