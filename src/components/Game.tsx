import React, { useState, useEffect, useCallback, TouchEvent } from 'react';
import { Trophy, Heart, Gamepad2 } from 'lucide-react';

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 15;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 5;

// Touch controls
const MIN_SWIPE_DISTANCE = 30;

export default function Game() {
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  const checkCollision = (head: Position) => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    return false;
  };

  const restartGame = () => {
    setSnake([{ x: 7, y: 7 }]);
    setDirection('RIGHT');
    setFood(generateFood());
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    if (checkCollision(head)) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
      }
      return;
    }

    newSnake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      setFood(generateFood());
      setScore(prev => prev + 10);
      setSpeed(prev => Math.max(prev - SPEED_INCREASE, 50));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, gameOver, isPaused, generateFood, score, highScore, gameStarted]);

  // Handle touch events
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart || gameOver || isPaused || !gameStarted) return;

    e.preventDefault(); // Prevent scrolling while playing
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0 && direction !== 'LEFT') {
        setDirection('RIGHT');
      } else if (deltaX < 0 && direction !== 'RIGHT') {
        setDirection('LEFT');
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && direction !== 'UP') {
        setDirection('DOWN');
      } else if (deltaY < 0 && direction !== 'DOWN') {
        setDirection('UP');
      }
    }

    setTouchStart(null);
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const handleOverlayTouch = () => {
    if (gameOver) {
      restartGame();
    } else if (isPaused) {
      setIsPaused(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      
      if (e.key === ' ') {
        setIsPaused(prev => !prev);
        return;
      }

      if (gameOver) {
        if (e.key === 'Enter') {
          restartGame();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver, generateFood, gameStarted]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, speed]);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setGameStarted(true);
    }
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.2)] p-8 w-full max-w-sm mx-auto space-y-8">
          <div className="text-center">
            <div className="relative">
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
                Snake Game
              </h1>
              <div className="absolute -top-6 -right-6 rotate-12">
                <Gamepad2 className="w-12 h-12 text-indigo-500" />
              </div>
            </div>
            <p className="text-gray-600 text-lg mt-4">Enter your name to start playing!</p>
          </div>
          
          <form onSubmit={handleStartGame} className="space-y-6">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg transition-all duration-200"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Game 🚀
            </button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur"></div>
            <div className="relative text-center py-3 bg-white/90 rounded-xl shadow-inner">
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Designed and Developed by
              </p>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Aniruddh Joshi
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cellSize = window.innerWidth < 768 ? 16 : CELL_SIZE; // Smaller cells on mobile
  const gameAreaSize = GRID_SIZE * cellSize;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.2)] p-4 md:p-8 space-y-6 w-full max-w-[500px] mx-auto">
        <div className="text-center relative">
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
            Snake Game
          </h1>
          <p className="text-base md:text-lg font-medium text-gray-600">Player: {playerName}</p>
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-3 md:p-4 rounded-xl">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            <div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Score</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">{score}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
            <div>
              <p className="text-xs md:text-sm text-gray-500 font-medium">High Score</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800">{highScore}</p>
            </div>
          </div>
        </div>

        <div 
          className="flex justify-center touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-inner border-4 border-gray-700"
            style={{
              width: gameAreaSize,
              height: gameAreaSize,
            }}
          >
            <div
              className="absolute bg-red-500 rounded-full shadow-lg transition-all duration-100"
              style={{
                width: cellSize - 2,
                height: cellSize - 2,
                left: food.x * cellSize,
                top: food.y * cellSize,
              }}
            />

            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute rounded-sm transition-all duration-75 shadow-sm ${
                  index === 0 
                    ? 'bg-gradient-to-br from-green-500 to-green-600' 
                    : 'bg-gradient-to-br from-green-400 to-green-500'
                }`}
                style={{
                  width: cellSize - 2,
                  height: cellSize - 2,
                  left: segment.x * cellSize,
                  top: segment.y * cellSize,
                }}
              />
            ))}

            {(gameOver || isPaused) && (
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                onClick={handleOverlayTouch}
                onTouchEnd={handleOverlayTouch}
              >
                <div className="text-center text-white p-6 transform scale-110">
                  {gameOver ? (
                    <>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4">Game Over!</h2>
                      <p className="text-base md:text-lg mb-4">
                        {window.innerWidth < 768 ? 'Tap to restart' : 'Press Enter to restart'}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4">Paused</h2>
                      <p className="text-base md:text-lg mb-4">
                        {window.innerWidth < 768 ? 'Tap to continue' : 'Press Space to continue'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-gray-600 text-sm md:text-lg font-medium">
            {window.innerWidth < 768 
              ? 'Swipe to move • Tap to pause'
              : 'Use arrow keys to move • Press Space to pause'}
          </p>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 blur"></div>
            <div className="relative py-2 bg-white/90 rounded-xl shadow-inner">
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-sm md:text-base">
                Designed and Developed by
              </p>
              <p className="text-base md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Aniruddh Joshi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}