import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import LevelGenerator from './components/LevelGenerator';
import { GameState, Level, ObstacleType } from './types';

// Default initial level
const INITIAL_LEVEL: Level = {
  name: "Neo Genesis",
  description: "The first simulation.",
  themeColor: "#00f3ff",
  speed: 6,
  data: [
    { type: ObstacleType.SPIKE, xOffset: 500, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 300, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 40, yLevel: 1 },
    { type: ObstacleType.SPIKE, xOffset: 300, yLevel: 0 },
    { type: ObstacleType.SPIKE, xOffset: 300, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 250, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 400, yLevel: 0 },
    { type: ObstacleType.FLYING_SPIKE, xOffset: 200, yLevel: 1 },
    { type: ObstacleType.BLOCK, xOffset: 400, yLevel: 0 },
    { type: ObstacleType.SPIKE, xOffset: 400, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 300, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 40, yLevel: 1 },
    { type: ObstacleType.BLOCK, xOffset: 40, yLevel: 2 },
    { type: ObstacleType.SPIKE, xOffset: 300, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 400, yLevel: 0 },
    { type: ObstacleType.SPIKE, xOffset: 400, yLevel: 0 },
    { type: ObstacleType.SPIKE, xOffset: 150, yLevel: 0 },
    { type: ObstacleType.BLOCK, xOffset: 300, yLevel: 1 },
  ]
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevel, setCurrentLevel] = useState<Level>(INITIAL_LEVEL);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleLevelGenerated = (level: Level) => {
    setCurrentLevel(level);
    setGameState(GameState.MENU); // Go to menu with new level ready
    setLoading(false);
  };

  const startGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
  };
  
  const handleVictory = () => {
      setGameState(GameState.VICTORY);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          NEO-DASH
        </h1>
        <p className="text-slate-400 mt-2 font-mono text-sm tracking-widest uppercase">
          AI-Generated Rhythm Action
        </p>
      </header>

      {/* Main Game Area */}
      <div className="relative w-full max-w-[800px]">
        <GameCanvas 
          level={currentLevel}
          gameState={gameState}
          onGameOver={handleGameOver}
          onVictory={handleVictory}
          setScore={setScore}
        />

        {/* Overlays */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10 p-8">
            <h2 className="text-3xl font-bold text-white mb-2">{currentLevel.name}</h2>
            <p className="text-slate-400 mb-8 max-w-md text-center">{currentLevel.description}</p>
            
            <button 
              onClick={startGame}
              className="px-12 py-4 bg-green-500 hover:bg-green-400 text-black font-black text-2xl uppercase skew-x-[-10deg] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.6)] mb-8"
            >
              START RUN
            </button>
            
            <div className="border-t border-slate-700 w-full pt-6">
                 <LevelGenerator 
                    onLevelGenerated={handleLevelGenerated} 
                    isLoading={loading}
                    setIsLoading={setLoading}
                 />
            </div>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 bg-red-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-lg z-10">
            <h2 className="text-6xl font-black text-white drop-shadow-md mb-4">CRASHED</h2>
            <p className="text-xl text-red-200 mb-8">Completion: {score}%</p>
            <div className="flex gap-4">
                <button 
                onClick={startGame}
                className="px-8 py-3 bg-white text-red-900 font-bold text-xl uppercase rounded hover:bg-gray-200 transition-colors"
                >
                Retry
                </button>
                <button 
                onClick={() => setGameState(GameState.MENU)}
                className="px-8 py-3 border-2 border-white text-white font-bold text-xl uppercase rounded hover:bg-white/10 transition-colors"
                >
                Menu
                </button>
            </div>
          </div>
        )}
        
         {gameState === GameState.VICTORY && (
          <div className="absolute inset-0 bg-green-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-lg z-10">
            <h2 className="text-6xl font-black text-yellow-300 drop-shadow-md mb-4">COMPLETE!</h2>
            <p className="text-xl text-green-100 mb-8">Level: {currentLevel.name}</p>
            <div className="flex gap-4">
                <button 
                onClick={startGame}
                className="px-8 py-3 bg-white text-green-900 font-bold text-xl uppercase rounded hover:bg-gray-200 transition-colors"
                >
                Play Again
                </button>
                <button 
                onClick={() => setGameState(GameState.MENU)}
                className="px-8 py-3 border-2 border-white text-white font-bold text-xl uppercase rounded hover:bg-white/10 transition-colors"
                >
                New Level
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-slate-500 font-mono text-xs text-center">
        CONTROLS: SPACE, UP ARROW, or TAP SCREEN to JUMP
      </div>
    </div>
  );
};

export default App;
