import React from 'react';

type ScoreBugProps = {
  score: number;
  errors: number;
};

const ScorePart: React.FC<{ colored: boolean; className?: string }> = ({ colored, className = '' }) => (
  <div className={`transition-colors duration-500 ${colored ? 'bg-green-500' : 'bg-gray-300'} ${className}`} />
);

export const ScoreBug: React.FC<ScoreBugProps> = ({ score, errors }) => {
  const isColored = (partNum: number) => score >= partNum;

  return (
    <div className="flex items-center justify-center gap-6 md:gap-12 p-3 bg-white/70 rounded-xl shadow-md">
      {/* Visual Bug */}
      <div className="relative w-28 h-20">
        {/* Body */}
        <ScorePart colored={isColored(1)} className="absolute w-14 h-14 rounded-full top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-10" />
        {/* Head */}
        <ScorePart colored={isColored(2)} className="absolute w-8 h-8 rounded-full top-0 left-1/2 -translate-x-1/2 z-10" />
        {/* Antennae */}
        <ScorePart colored={isColored(3)} className="absolute w-1 h-5 top-[-10px] left-[calc(50%-8px)] rotate-[-20deg]" />
        <ScorePart colored={isColored(4)} className="absolute w-1 h-5 top-[-10px] left-[calc(50%+6px)] rotate-[20deg]" />
        {/* Legs */}
        <ScorePart colored={isColored(5)} className="absolute w-6 h-1 top-6 left-4 rotate-[45deg]" />
        <ScorePart colored={isColored(6)} className="absolute w-6 h-1 top-6 right-4 rotate-[-45deg]" />
        <ScorePart colored={isColored(7)} className="absolute w-6 h-1 top-9 left-4" />
        <ScorePart colored={isColored(8)} className="absolute w-6 h-1 top-9 right-4" />
        <ScorePart colored={isColored(9)} className="absolute w-6 h-1 top-12 left-4 rotate-[-45deg]" />
        <ScorePart colored={isColored(10)} className="absolute w-6 h-1 top-12 right-4 rotate-[45deg]" />
      </div>
      
      {/* Score and Errors Text */}
      <div className="flex gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600">{score}</div>
          <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Score</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-red-500">{errors}</div>
          <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Errors</div>
        </div>
      </div>
    </div>
  );
};