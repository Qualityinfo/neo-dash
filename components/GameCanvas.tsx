import React, { useEffect, useRef } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_HEIGHT, 
  PLAYER_SIZE, 
  BLOCK_SIZE, 
  GRAVITY, 
  JUMP_FORCE,
  ROTATION_SPEED 
} from '../constants';
import { GameState, Level, ObstacleType } from '../types';

interface GameCanvasProps {
  level: Level;
  gameState: GameState;
  onGameOver: (score: number) => void;
  onVictory: (score: number) => void;
  setScore: (score: number) => void;
}

// Internal physics types
interface Player {
  x: number;
  y: number;
  dy: number;
  rotation: number;
  onGround: boolean;
  dead: boolean;
}

interface RenderObstacle {
  x: number;
  y: number;
  type: ObstacleType;
  passed: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  level, 
  gameState, 
  onGameOver, 
  onVictory,
  setScore 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (Mutable for performance loop)
  const playerRef = useRef<Player>({
    x: 100, // Fixed horizontal position
    y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
    dy: 0,
    rotation: 0,
    onGround: true,
    dead: false
  });
  
  const obstaclesRef = useRef<RenderObstacle[]>([]);
  const cameraXRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  // Prop Refs (To access latest props inside the frozen closure of the loop)
  const gameStateRef = useRef(gameState);
  const levelRef = useRef(level);
  const onGameOverRef = useRef(onGameOver);
  const onVictoryRef = useRef(onVictory);
  const setScoreRef = useRef(setScore);

  // Keep Refs in sync with React Props
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);
  useEffect(() => { onVictoryRef.current = onVictory; }, [onVictory]);
  useEffect(() => { setScoreRef.current = setScore; }, [setScore]);
  
  // Initialize/Reset Game Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      resetGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, level]);

  const resetGame = () => {
    playerRef.current = {
      x: 100,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      dy: 0,
      rotation: 0,
      onGround: true,
      dead: false
    };
    cameraXRef.current = 0;
    scoreRef.current = 0;
    
    // We update the ref, but we should also safely reset the displayed score
    if (setScoreRef.current) setScoreRef.current(0);

    // Convert relative offsets to absolute X positions for physics
    let currentX = 600; // Start a bit ahead
    const loadedObstacles: RenderObstacle[] = level.data.map(obs => {
      currentX += obs.xOffset;
      // Calculate Y based on grid system (0 is ground)
      const yPos = CANVAS_HEIGHT - GROUND_HEIGHT - (obs.yLevel * BLOCK_SIZE) - BLOCK_SIZE;
      
      return {
        x: currentX,
        y: yPos,
        type: obs.type,
        passed: false
      };
    });
    
    // Add a victory line far at the end
    loadedObstacles.push({
        x: currentX + 800,
        y: 0,
        type: 'FINISH_LINE' as any,
        passed: false
    })

    obstaclesRef.current = loadedObstacles;
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
        e.preventDefault();
      }
    };
    
    const handleTouch = (e: TouchEvent) => {
        if(gameState !== GameState.PLAYING) return;
        jump();
        e.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [gameState]);

  const jump = () => {
    const p = playerRef.current;
    if (p.onGround) {
      p.dy = JUMP_FORCE;
      p.onGround = false;
    }
  };

  // Physics Update
  const update = () => {
    // Access state via Refs to ensure loop sees current state without re-binding
    if (gameStateRef.current !== GameState.PLAYING) return;

    const p = playerRef.current;
    const currentLevel = levelRef.current;
    
    // 1. Move Physics
    p.dy += GRAVITY;
    p.y += p.dy;
    
    // Rotation logic
    if (!p.onGround) {
      p.rotation += ROTATION_SPEED;
    } else {
      // Snap to nearest 90 degrees when on ground
      const snap = Math.round(p.rotation / 90) * 90;
      p.rotation += (snap - p.rotation) * 0.2;
    }

    // Move camera/world
    cameraXRef.current += currentLevel.speed;
    
    // OPTIMIZED SCORE UPDATE: Only trigger React render if score changes
    const newScore = Math.floor(cameraXRef.current / 100);
    if (newScore > scoreRef.current) {
        scoreRef.current = newScore;
        setScoreRef.current(newScore);
    }

    // 2. Floor Collision
    const floorY = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
    
    // Reset ground state before checks
    let isSupported = false;

    // 3. Obstacle Collision
    const playerRect = {
      l: p.x + 4, // Hitbox slightly smaller than visual
      r: p.x + PLAYER_SIZE - 4,
      t: p.y + 4,
      b: p.y + PLAYER_SIZE - 2
    };

    // Check Ground Plane
    if (p.y >= floorY) {
        p.y = floorY;
        p.dy = 0;
        p.onGround = true;
        isSupported = true;
    }

    for (const obs of obstaclesRef.current) {
        // Calculate relative position for collision
        const obsScreenX = obs.x - cameraXRef.current;
        
        // Optimization: Skip objects far off screen
        if (obsScreenX > CANVAS_WIDTH || obsScreenX + BLOCK_SIZE < -100) continue;

        // Victory Condition
        if (obs.type === 'FINISH_LINE' as any) {
            if (p.x > obsScreenX) {
                onVictoryRef.current(scoreRef.current);
                return;
            }
        }

        const obsRect = {
            l: obsScreenX + 4,
            r: obsScreenX + BLOCK_SIZE - 4,
            t: obs.y + 4,
            b: obs.y + BLOCK_SIZE
        };

        // AABB Collision Test
        const colliding = !(playerRect.r < obsRect.l || 
                            playerRect.l > obsRect.r || 
                            playerRect.b < obsRect.t || 
                            playerRect.t > obsRect.b);

        if (colliding) {
            if (obs.type === ObstacleType.SPIKE || obs.type === ObstacleType.FLYING_SPIKE) {
                const spikePad = 10;
                const spikeColliding = !(playerRect.r < obsRect.l + spikePad || 
                                       playerRect.l > obsRect.r - spikePad || 
                                       playerRect.b < obsRect.t + spikePad || 
                                       playerRect.t > obsRect.b);
                
                if (spikeColliding) {
                    die();
                    return;
                }
            } else if (obs.type === ObstacleType.BLOCK) {
                // Resolve Block Collision
                const overlapY = Math.min(playerRect.b - obsRect.t, obsRect.b - playerRect.t);
                const overlapX = Math.min(playerRect.r - obsRect.l, obsRect.r - playerRect.l);

                if (overlapY < overlapX) {
                    // Vertical collision
                    if (p.dy > 0 && p.y < obs.y) {
                        // Landing on top
                        p.y = obs.y - PLAYER_SIZE;
                        p.dy = 0;
                        p.onGround = true;
                        isSupported = true;
                    } else if (p.dy < 0 && p.y > obs.y) {
                        // Hitting head on bottom (bonk)
                        p.y = obs.y + BLOCK_SIZE;
                        p.dy = 0;
                        die();
                        return;
                    }
                } else {
                    // Horizontal collision (Crash)
                    die();
                    return;
                }
            }
        }
    }

    // Check if fell off logic
    if (!isSupported && p.y < floorY) {
        p.onGround = false;
    }
  };

  const die = () => {
    playerRef.current.dead = true;
    onGameOverRef.current(scoreRef.current);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Access current theme via ref
    const currentTheme = levelRef.current.themeColor;

    // Clear Screen
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const offsetX = -(cameraXRef.current % 40);
    for (let x = offsetX; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }

    // Draw Ground
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Ground Line (Neon)
    ctx.shadowBlur = 10;
    ctx.shadowColor = currentTheme;
    ctx.strokeStyle = currentTheme;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
        const screenX = obs.x - cameraXRef.current;
        if (screenX < -BLOCK_SIZE || screenX > CANVAS_WIDTH) return; // Cull

        if (obs.type === 'FINISH_LINE' as any) {
             ctx.fillStyle = '#FFD700';
             ctx.fillRect(screenX, 0, 10, CANVAS_HEIGHT);
             return;
        }

        if (obs.type === ObstacleType.BLOCK) {
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = currentTheme;
            ctx.lineWidth = 2;
            ctx.fillRect(screenX, obs.y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeRect(screenX, obs.y, BLOCK_SIZE, BLOCK_SIZE);
            
            ctx.fillStyle = currentTheme;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(screenX + 8, obs.y + 8, BLOCK_SIZE - 16, BLOCK_SIZE - 16);
            ctx.globalAlpha = 1.0;
        } else if (obs.type === ObstacleType.SPIKE || obs.type === ObstacleType.FLYING_SPIKE) {
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = (obs.type === ObstacleType.SPIKE) ? currentTheme : '#ff0000';
            
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, obs.y + BLOCK_SIZE);
            ctx.lineTo(screenX + BLOCK_SIZE / 2, obs.y);
            ctx.lineTo(screenX + BLOCK_SIZE, obs.y + BLOCK_SIZE);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = currentTheme;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    });

    // Draw Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-(p.x + PLAYER_SIZE / 2), -(p.y + PLAYER_SIZE / 2));

    ctx.fillStyle = currentTheme;
    ctx.fillRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(p.x + 8, p.y + 8, PLAYER_SIZE - 16, PLAYER_SIZE - 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.x + 12, p.y + 12, 6, 6);
    ctx.fillRect(p.x + 22, p.y + 12, 6, 6);
    
    ctx.restore();
  };

  // Main Loop - Detached from Props to prevent infinite re-renders
  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    
    // Start Loop
    requestRef.current = requestAnimationFrame(loop);
    
    // Cleanup
    return () => {
        if(requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount

  return (
    <div className="relative group">
       <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-slate-700 rounded-lg shadow-2xl bg-slate-900 mx-auto block w-full max-w-[800px]"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute top-4 left-4 font-mono text-xl text-white font-bold drop-shadow-md">
        SCORE: {Math.floor(scoreRef.current)}%
      </div>
    </div>
  );
};

export default GameCanvas;