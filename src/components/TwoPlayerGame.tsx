import React, { useMemo, useState } from 'react';
import { FactorBug, type BodyShape } from '@/components/FactorBug';
import type { FactorInfo, UserInputState } from '@/types';
import { GameMode, NumberType } from '@/types';
import { calculateFactorInfo } from '@/utils/factors';

type BoardSize = 9 | 16 | 25;
type PlayerIndex = 0 | 1;

const BOARD_OPTIONS: { size: BoardSize; label: string; detail: string }[] = [
  { size: 9, label: 'Quick Game', detail: '3 × 3 board' },
  { size: 16, label: 'Standard Game', detail: '4 × 4 board' },
  { size: 25, label: 'Big Bug Battle', detail: '5 × 5 board' },
];

const MIX: Record<BoardSize, { composite: number; prime: number; square: number }> = {
  9: { composite: 5, prime: 2, square: 2 },
  16: { composite: 9, prime: 4, square: 3 },
  25: { composite: 14, prime: 6, square: 5 },
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const generateBoard = (size: BoardSize) => {
  const values = Array.from({ length: 99 }, (_, i) => i + 2);
  const primes = values.filter(n => calculateFactorInfo(n).type === NumberType.Prime);
  const squares = values.filter(n => calculateFactorInfo(n).type === NumberType.Square);
  const composites = values.filter(n => calculateFactorInfo(n).type === NumberType.Composite);
  const mix = MIX[size];

  return shuffle([
    ...shuffle(composites).slice(0, mix.composite),
    ...shuffle(primes).slice(0, mix.prime),
    ...shuffle(squares).slice(0, mix.square),
  ]);
};

const emptyInputs = (): UserInputState => ({
  antennae: ['', ''],
  legs: [],
  stinger: null,
});

const isBugCorrect = (factorInfo: FactorInfo, inputs: UserInputState, bodyShape: BodyShape) => {
  const correctBodyShape: BodyShape = factorInfo.type === NumberType.Prime ? 'slug' : 'bug';
  if (bodyShape !== correctBodyShape) return false;

  const correctLegPairs = Math.max(0, factorInfo.pairs.length - 1);
  const correctHasStinger = factorInfo.stinger !== null;

  if (inputs.legs.length !== correctLegPairs) return false;
  if ((inputs.stinger !== null) !== correctHasStinger) return false;

  const antennae = [parseInt(inputs.antennae[0]), parseInt(inputs.antennae[1])].sort((a, b) => a - b);
  if (
    factorInfo.pairs.length > 0 &&
    (antennae[0] !== factorInfo.pairs[0][0] || antennae[1] !== factorInfo.pairs[0][1])
  ) {
    return false;
  }

  const remainingPairs = factorInfo.pairs.slice(1).map(pair => [...pair] as [number, number]);
  for (const pair of inputs.legs) {
    const userPair = [parseInt(pair[0]), parseInt(pair[1])].sort((a, b) => a - b);
    const foundIndex = remainingPairs.findIndex(
      actual => actual[0] === userPair[0] && actual[1] === userPair[1]
    );
    if (foundIndex === -1) return false;
    remainingPairs.splice(foundIndex, 1);
  }

  if (remainingPairs.length > 0) return false;

  if (
    factorInfo.stinger !== null &&
    (inputs.stinger === null || parseInt(inputs.stinger) !== factorInfo.stinger)
  ) {
    return false;
  }

  return true;
};

export const TwoPlayerGame: React.FC = () => {
  const [boardSize, setBoardSize] = useState<BoardSize>(16);
  const [board, setBoard] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerIndex>(0);
  const [hotels, setHotels] = useState<[number[], number[]]>([[], []]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [inputs, setInputs] = useState<UserInputState | null>(null);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [bodyShape, setBodyShape] = useState<BodyShape>('bug');

  const factorInfo = useMemo(
    () => (selectedNumber === null ? null : calculateFactorInfo(selectedNumber)),
    [selectedNumber]
  );

  const startGame = () => {
    setBoard(generateBoard(boardSize));
    setCurrentPlayer(0);
    setHotels([[], []]);
    setSelectedNumber(null);
    setInputs(null);
    setResult(null);
    setBodyShape('bug');
    setBodyShape('bug');
    setGameStarted(true);
  };

  const selectNumber = (number: number) => {
    if (selectedNumber !== null || result !== null) return;
    setSelectedNumber(number);
    setInputs(emptyInputs());
    setBodyShape('bug');
  };

  const handleInputChange = (
    type: 'antennae' | 'legs' | 'stinger',
    index: number,
    subIndex: number,
    value: string
  ) => {
    if (!inputs || result !== null) return;
    const next: UserInputState = {
      antennae: [...inputs.antennae] as [string, string],
      legs: inputs.legs.map(pair => [...pair] as [string, string]),
      stinger: inputs.stinger,
    };

    if (type === 'antennae') next.antennae[subIndex] = value;
    if (type === 'legs') next.legs[index][subIndex] = value;
    if (type === 'stinger') next.stinger = value;
    setInputs(next);
  };

  const changeStructure = (action: 'addLeg' | 'removeLeg' | 'toggleStinger' | 'toggleBody') => {
    if (!inputs || result !== null) return;
    const next: UserInputState = {
      antennae: [...inputs.antennae] as [string, string],
      legs: inputs.legs.map(pair => [...pair] as [string, string]),
      stinger: inputs.stinger,
    };

    if (action === 'toggleBody') setBodyShape(shape => shape === 'bug' ? 'slug' : 'bug');
    if (action === 'addLeg') next.legs.push(['', '']);
    if (action === 'removeLeg') next.legs.pop();
    if (action === 'toggleStinger') next.stinger = next.stinger === null ? '' : null;
    setInputs(next);
  };

  const checkBug = () => {
    if (!factorInfo || !inputs || result !== null) return;

    if (isBugCorrect(factorInfo, inputs, bodyShape)) {
      setBoard(previous => previous.filter(n => n !== factorInfo.number));
      setHotels(previous => {
        const next: [number[], number[]] = [[...previous[0]], [...previous[1]]];
        next[currentPlayer].push(factorInfo.number);
        return next;
      });
      setResult('correct');
    } else {
      setResult('incorrect');
    }
  };

  const nextTurn = () => {
    setCurrentPlayer(currentPlayer === 0 ? 1 : 0);
    setSelectedNumber(null);
    setInputs(null);
    setResult(null);
  };

  const winnerText = () => {
    const [p1, p2] = hotels.map(hotel => hotel.length);
    if (p1 === p2) return `It's a draw — ${p1} bugs each!`;
    return p1 > p2
      ? `Player 1 wins ${p1}–${p2}!`
      : `Player 2 wins ${p2}–${p1}!`;
  };

  if (!gameStarted) {
    return (
      <div className="w-full max-w-3xl bg-white/70 rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-3xl font-bold text-green-800 text-center mb-2">Bug Battle</h2>
        <p className="text-center text-gray-600 mb-6">
          Two players take turns choosing a number and building its factor bug. Build it correctly to collect it for your Bug Hotel!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {BOARD_OPTIONS.map(option => (
            <button
              key={option.size}
              onClick={() => setBoardSize(option.size)}
              className={`p-4 rounded-xl border-2 transition-all ${
                boardSize === option.size
                  ? 'border-green-600 bg-green-100 shadow-md'
                  : 'border-amber-200 bg-amber-50 hover:border-green-300'
              }`}
            >
              <div className="font-bold text-lg text-green-800">{option.label}</div>
              <div className="text-sm text-gray-600">{option.detail}</div>
            </button>
          ))}
        </div>

        <div className="bg-amber-100/70 rounded-xl p-4 mb-6 text-sm md:text-base text-gray-700">
          <strong>How to play:</strong> choose a number, add the right number of leg pairs and decide whether your bug needs a stinger, then enter every factor pair. A correct bug goes to your hotel. An incorrect bug stays on the board for another turn.
        </div>

        <div className="text-center">
          <button
            onClick={startGame}
            className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors"
          >
            Start Bug Battle
          </button>
        </div>
      </div>
    );
  }

  if (board.length === 0 && result === 'correct') {
    return (
      <div className="w-full max-w-3xl bg-white/80 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-3">🏨🐞</div>
        <h2 className="text-4xl font-bold text-green-800 mb-3">Bug Battle Complete!</h2>
        <p className="text-2xl font-bold text-gray-800 mb-6">{winnerText()}</p>
        <div className="flex justify-center gap-8 mb-8">
          <div><span className="font-bold">Player 1:</span> {hotels[0].length} bugs</div>
          <div><span className="font-bold">Player 2:</span> {hotels[1].length} bugs</div>
        </div>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  const gridSide = Math.sqrt(boardSize);

  return (
    <div className="w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {[0, 1].map(player => (
          <div
            key={player}
            className={`rounded-xl border-2 p-3 ${
              currentPlayer === player ? 'border-green-600 bg-green-100' : 'border-amber-200 bg-white/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-green-900">Player {player + 1}'s Bug Hotel</h3>
              <span className="font-bold text-xl">{hotels[player as PlayerIndex].length}</span>
            </div>
            <div className="min-h-10 flex flex-wrap gap-2">
              {hotels[player as PlayerIndex].length === 0 ? (
                <span className="text-sm text-gray-500">No bugs yet</span>
              ) : (
                hotels[player as PlayerIndex].map(number => (
                  <span
                    key={number}
                    title={`Factor bug ${number}`}
                    className="inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-full bg-amber-200 border-2 border-amber-400 font-bold text-gray-800"
                  >
                    {number}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mb-3">
        <span className="inline-block px-5 py-2 rounded-full bg-green-700 text-white font-bold shadow">
          Player {currentPlayer + 1}'s turn
        </span>
      </div>

      <div className="bg-white/70 rounded-xl shadow-md p-4 mb-4">
        <p className="text-center font-semibold text-gray-700 mb-3">
          {selectedNumber === null ? 'Choose a number from the board.' : `Build the factor bug for ${selectedNumber}.`}
        </p>
        <div
          className="grid gap-2 max-w-2xl mx-auto"
          style={{ gridTemplateColumns: `repeat(${gridSide}, minmax(0, 1fr))` }}
        >
          {board.map(number => (
            <button
              key={number}
              disabled={selectedNumber !== null}
              onClick={() => selectNumber(number)}
              className={`aspect-square rounded-xl border-2 font-extrabold text-xl md:text-2xl transition-all ${
                selectedNumber === number
                  ? 'bg-green-600 text-white border-green-700 scale-95'
                  : 'bg-amber-100 border-amber-300 hover:bg-green-100 hover:border-green-400 disabled:opacity-60'
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      {factorInfo && inputs && (
        <div className="bg-white/70 rounded-xl shadow-md p-4">
          <div className="flex flex-wrap justify-center items-center gap-2 mb-1">
            <span className="font-semibold text-gray-700 mr-1">Build the bug:</span>
            <button
              onClick={() => changeStructure('toggleBody')}
              disabled={result !== null}
              className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
            >
              Body: {bodyShape === 'bug' ? 'Bug' : 'Slug'}
            </button>
            <button
              onClick={() => changeStructure('addLeg')}
              disabled={result !== null}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              + Leg Pair
            </button>
            <button
              onClick={() => changeStructure('removeLeg')}
              disabled={inputs.legs.length === 0 || result !== null}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              − Leg Pair
            </button>
            <button
              onClick={() => changeStructure('toggleStinger')}
              disabled={result !== null}
              className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
            >
              Toggle Stinger
            </button>
          </div>

          <FactorBug
            mode={GameMode.TwoPlayer}
            factorInfo={factorInfo}
            userInputs={inputs}
            onInputChange={handleInputChange}
            bodyShape={bodyShape}
          />

          <div className="text-center -mt-2">
            {result === null ? (
              <button
                onClick={checkBug}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700"
              >
                Check Bug
              </button>
            ) : (
              <div>
                <p className={`text-xl font-bold mb-3 ${result === 'correct' ? 'text-green-700' : 'text-red-600'}`}>
                  {result === 'correct'
                    ? `Correct! Player ${currentPlayer + 1} collects the ${selectedNumber} bug.`
                    : 'Not quite. The bug stays on the board.'}
                </p>
                {board.length > 0 && (
                  <button
                    onClick={nextTurn}
                    className="px-8 py-3 bg-green-700 text-white font-bold rounded-lg shadow-lg hover:bg-green-800"
                  >
                    Pass to Player {currentPlayer === 0 ? 2 : 1}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
