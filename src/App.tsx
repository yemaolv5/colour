/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RefreshCw, Info, ChevronRight, AlertCircle, Eye } from 'lucide-react';

// --- Types ---

interface GameState {
  status: 'idle' | 'playing' | 'gameover';
  score: number;
  level: number;
  timeLeft: number;
  gridSize: number;
  baseColor: string;
  diffColor: string;
  diffIndex: number;
}

// --- Constants ---

const INITIAL_TIME = 15;
const MAX_GRID_SIZE = 9;
const MIN_DIFF = 2; // Minimum color difference in HSL

// --- Utils ---

const generateColor = (level: number) => {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 40) + 40; // 40-80%
  const l = Math.floor(Math.random() * 40) + 30; // 30-70%
  
  // Difficulty scaling: difference decreases as level increases
  // Level 1: diff = 20
  // Level 10: diff = 10
  // Level 30: diff = 4
  const diff = Math.max(MIN_DIFF, 20 - Math.floor(level / 2));
  
  const isLightnessDiff = Math.random() > 0.5;
  const hDiff = !isLightnessDiff ? (Math.random() > 0.5 ? diff : -diff) : 0;
  const lDiff = isLightnessDiff ? (Math.random() > 0.5 ? diff : -diff) : 0;

  const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
  const diffColor = `hsl(${(h + hDiff + 360) % 360}, ${s}%, ${Math.min(100, Math.max(0, l + lDiff))}%)`;

  return { baseColor, diffColor };
};

export default function App() {
  const [game, setGame] = useState<GameState>({
    status: 'idle',
    score: 0,
    level: 1,
    timeLeft: INITIAL_TIME,
    gridSize: 2,
    baseColor: '',
    diffColor: '',
    diffIndex: -1,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startNewLevel = useCallback((currentLevel: number, currentScore: number) => {
    const nextLevel = currentLevel + 1;
    const gridSize = Math.min(MAX_GRID_SIZE, Math.max(5, Math.floor(nextLevel / 5) + 2));
    const { baseColor, diffColor } = generateColor(nextLevel);
    const diffIndex = Math.floor(Math.random() * (gridSize * gridSize));

    setGame(prev => ({
      ...prev,
      status: 'playing',
      level: nextLevel,
      score: currentScore,
      gridSize,
      baseColor,
      diffColor,
      diffIndex,
      timeLeft: Math.min(INITIAL_TIME, prev.timeLeft + 2), // Bonus time for correct answer
    }));
  }, []);

  const startGame = () => {
    const gridSize = 5;
    const { baseColor, diffColor } = generateColor(1);
    const diffIndex = Math.floor(Math.random() * (gridSize * gridSize));

    setGame({
      status: 'playing',
      score: 0,
      level: 1,
      timeLeft: INITIAL_TIME,
      gridSize,
      baseColor,
      diffColor,
      diffIndex,
    });
  };

  const handleBlockClick = (index: number) => {
    if (game.status !== 'playing') return;

    if (index === game.diffIndex) {
      startNewLevel(game.level, game.score + 1);
    } else {
      // Penalty for wrong click
      setGame(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 3) }));
    }
  };

  useEffect(() => {
    if (game.status === 'playing') {
      timerRef.current = setInterval(() => {
        setGame(prev => {
          if (prev.timeLeft <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return { ...prev, status: 'gameover', timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 0.1 };
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game.status]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase italic flex items-center gap-2">
              色彩敏锐度
              <span className="text-xs font-mono not-italic bg-black text-white px-2 py-0.5 rounded-full">v1.0</span>
            </h1>
            <p className="text-sm text-neutral-500 font-medium uppercase tracking-widest mt-1">艺术生色彩敏感度挑战</p>
          </div>
          
          <div className="flex gap-6 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                <Trophy size={10} /> 得分
              </span>
              <span className="text-2xl font-mono font-bold leading-none">{game.score}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                <Timer size={10} /> 时间
              </span>
              <span className={`text-2xl font-mono font-bold leading-none transition-colors ${game.timeLeft < 5 ? 'text-red-500 animate-pulse' : ''}`}>
                {game.timeLeft.toFixed(1)}s
              </span>
            </div>
          </div>
        </header>

        <main className="relative aspect-square w-full bg-white rounded-3xl shadow-2xl shadow-black/5 border border-black/5 p-4 md:p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            {game.status === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 via-blue-500 to-purple-600 animate-spin-slow blur-xl opacity-20 absolute" />
                <Eye size={48} className="text-neutral-300" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">准备好测试你的眼力了吗？</h2>
                  <p className="text-neutral-500 max-w-xs mx-auto text-sm">
                    找出那个颜色略有不同的色块。
                    难度会随着关卡的增加而提升。
                  </p>
                </div>
                <button 
                  onClick={startGame}
                  className="group relative px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform active:scale-95 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    开始挑战 <ChevronRight size={16} />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </motion.div>
            )}

            {game.status === 'playing' && (
              <motion.div 
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full grid gap-2 md:gap-4"
                style={{ 
                  gridTemplateColumns: `repeat(${game.gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${game.gridSize}, 1fr)`
                }}
              >
                {Array.from({ length: game.gridSize * game.gridSize }).map((_, i) => (
                  <motion.button
                    key={`${game.level}-${i}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    onClick={() => handleBlockClick(i)}
                    className="w-full h-full rounded-lg md:rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    style={{ 
                      backgroundColor: i === game.diffIndex ? game.diffColor : game.baseColor 
                    }}
                  />
                ))}
              </motion.div>
            )}

            {game.status === 'gameover' && (
              <motion.div 
                key="gameover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
                    <AlertCircle size={12} /> 时间到
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter">游戏结束</h2>
                  <p className="text-neutral-500">你的视觉敏锐度令人印象深刻。</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="bg-neutral-50 p-6 rounded-3xl border border-black/5">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">最终得分</span>
                    <span className="text-4xl font-mono font-bold">{game.score}</span>
                  </div>
                  <div className="bg-neutral-50 p-6 rounded-3xl border border-black/5">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">到达关卡</span>
                    <span className="text-4xl font-mono font-bold">{game.level}</span>
                  </div>
                </div>

                <div className="w-full max-w-sm bg-neutral-900 text-white p-6 rounded-3xl space-y-4 text-left">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Info size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">色彩分析</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    在第 {game.level} 关，颜色差异已缩小至约 {Math.max(MIN_DIFF, 20 - Math.floor(game.level / 2))}% 的亮度或色相。
                    这需要视网膜中视锥细胞极高的敏感度。
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-lg border border-white/10" style={{ backgroundColor: game.baseColor }} />
                    <div className="flex-1 h-8 rounded-lg border border-white/10" style={{ backgroundColor: game.diffColor }} />
                  </div>
                  <p className="text-[10px] text-neutral-500 text-center">基础色 vs 目标色</p>
                </div>

                <button 
                  onClick={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform active:scale-95"
                >
                  <RefreshCw size={16} /> 再试一次
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Info */}
        <footer className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 bg-white/50 rounded-2xl border border-black/5">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Eye size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight">专注</h4>
              <p className="text-[10px] text-neutral-500 leading-tight mt-1">注视网格中心，利用外周视觉进行色彩检测。</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white/50 rounded-2xl border border-black/5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Timer size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight">速度</h4>
              <p className="text-[10px] text-neutral-500 leading-tight mt-1">正确答案奖励 +2秒。错误答案惩罚 -3秒。</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white/50 rounded-2xl border border-black/5">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Trophy size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-tight">等级</h4>
              <p className="text-[10px] text-neutral-500 leading-tight mt-1">得分 30+ 即可获得“色彩大师”称号。</p>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
