import React, { useState, useEffect, useCallback } from 'react';
import type { FactorInfo, UserInputState, CorrectnessState } from './types';
import { GameMode, NumberType } from './types';
import { FactorBug } from './components/FactorBug';

const calculateFactorInfo = (num: number): FactorInfo => {
  if (num < 1 || num > 100) {
    return { number: num, type: NumberType.Composite, pairs: [], stinger: null };
  }

  const pairs: [number, number][] = [];
  let stinger: number | null = null;

  for (let i = 1; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      if (i * i === num) {
        stinger = i;
      } else {
        pairs.push([i, num / i]);
      }
    }
  }

  // Ensure pairs are sorted, with [1, num] first
  pairs.sort((a, b) => a[0] - b[0]);
  if (stinger !== null) {
      const stingerPairIndex = pairs.findIndex(p => p[0] === stinger || p[1] === stinger);
      if(stingerPairIndex > -1) pairs.splice(stingerPairIndex, 1);
  }

  let type = NumberType.Composite;
  if (pairs.length === 1 && stinger === null) {
    type = NumberType.Prime;
  } else if (stinger !== null) {
    type = NumberType.Square;
  }

  return { number: num, type, pairs, stinger };
};


const NumberSelector: React.FC<{ onSelect: (num: number) => void; selected: number | null }> = ({ onSelect, selected }) => {
  return (
    <div className="p-4 bg-white/60 rounded-lg shadow-md">
      <label htmlFor="number-select" className="block text-lg font-medium text-gray-700 mb-2">
        Choose a number (1-100)
      </label>
      <select
        id="number-select"
        value={selected ?? ''}
        onChange={(e) => onSelect(parseInt(e.target.value))}
        className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-lg bg-white"
      >
        <option value="" disabled>Select a number</option>
        {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
};

const ModeSelector: React.FC<{ onSelect: (mode: GameMode) => void; selected: GameMode }> = ({ onSelect, selected }) => {
  const modes = [
    { id: GameMode.Watch, name: 'Watch & Learn' },
    // FIX: Corrected a typo from `Game-Mode.Guided` to `GameMode.Guided`.
    { id: GameMode.Guided, name: 'Guided Practice' },
    { id: GameMode.Creative, name: 'Creative Mode' },
  ];
  return (
    <div className="flex justify-center space-x-2 md:space-x-4 bg-white/80 p-2 rounded-full shadow-inner">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`px-4 py-2 md:px-6 md:py-3 text-sm md:text-base font-semibold rounded-full transition-all duration-300 ease-in-out ${
            selected === mode.id
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-transparent text-gray-600 hover:bg-green-100'
          }`}
        >
          {mode.name}
        </button>
      ))}
    </div>
  );
};


export default function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.Watch);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(7);
  const [factorInfo, setFactorInfo] = useState<FactorInfo | null>(null);
  const [animationStep, setAnimationStep] = useState(0);

  // State for Mode 2
  const [userInputs, setUserInputs] = useState<UserInputState | null>(null);
  const [correctness, setCorrectness] = useState<CorrectnessState | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  // State for Mode 3
  const [creativeNumber, setCreativeNumber] = useState<number | null>(null);
  const [creativeFactorInfo, setCreativeFactorInfo] = useState<FactorInfo | null>(null);
  const [creativeInputs, setCreativeInputs] = useState<UserInputState | null>(null);
  const [creativeCorrectness, setCreativeCorrectness] = useState<CorrectnessState | null>(null);
  const [showCreativeAnswers, setShowCreativeAnswers] = useState(false);
  const [creativeMessage, setCreativeMessage] = useState('');

  const generateNewCreativeBug = useCallback(() => {
    const newNum = Math.floor(Math.random() * 100) + 1;
    const info = calculateFactorInfo(newNum);
    setCreativeNumber(newNum);
    setCreativeFactorInfo(info);
    setCreativeInputs({
      antennae: ['', ''],
      legs: [],
      stinger: null,
    });
    setCreativeCorrectness(null);
    setShowCreativeAnswers(false);
    setCreativeMessage('');
  }, []);


  // Combined effect to handle mode and number changes
  useEffect(() => {
    setAnimationStep(0);
    setCorrectness(null);
    setShowAnswers(false);
    setCreativeCorrectness(null);
    setShowCreativeAnswers(false);
    setCreativeMessage('');

    if (mode === GameMode.Creative) {
      if (creativeNumber === null) {
          generateNewCreativeBug();
      }
    } else if (selectedNumber) { // For Watch and Guided modes
      const info = calculateFactorInfo(selectedNumber);
      setFactorInfo(info);
      
      if (mode === GameMode.Watch) {
        const totalSteps = (info.pairs.length) + (info.stinger ? 1 : 0);
        const interval = setInterval(() => {
          setAnimationStep(prev => (prev < totalSteps ? prev + 1 : prev));
        }, 700);
        return () => clearInterval(interval);
      } else if (mode === GameMode.Guided) {
        setUserInputs({
          antennae: ['', ''],
          legs: Array(info.pairs.length - 1).fill(['', '']),
          stinger: info.stinger !== null ? '' : null,
        });
      }
    } else {
      setFactorInfo(null);
      setUserInputs(null);
    }
  }, [mode, selectedNumber, generateNewCreativeBug, creativeNumber]);


  const handleNumberSelect = (num: number) => {
    setSelectedNumber(num);
  };
  
  const handleModeSelect = (newMode: GameMode) => {
    setMode(newMode);
    setSelectedNumber(newMode === GameMode.Watch ? 7 : null); 
    setFactorInfo(null);
  };

  const handleInputChange = (type: 'antennae' | 'legs' | 'stinger', index: number, subIndex: number, value: string) => {
    const isCreative = mode === GameMode.Creative;
    const targetState = isCreative ? creativeInputs : userInputs;
    const setter = isCreative ? setCreativeInputs : setUserInputs;

    if (!targetState) return;

    const newInputs = JSON.parse(JSON.stringify(targetState));
    if (type === 'antennae') newInputs.antennae[subIndex] = value;
    if (type === 'legs') newInputs.legs[index][subIndex] = value;
    if (type === 'stinger') newInputs.stinger = value;
    setter(newInputs);
  };
  
  const checkGuidedAnswers = () => {
    if (!factorInfo || !userInputs) return;

    const newCorrectness: CorrectnessState = {
        antennae: [false, false],
        legs: Array(factorInfo.pairs.length - 1).fill(null).map(() => [false, false]),
        stinger: null
    };

    const sortedAntennaeInput = [parseInt(userInputs.antennae[0]), parseInt(userInputs.antennae[1])].sort((a,b) => a-b);
    if(sortedAntennaeInput[0] === factorInfo.pairs[0][0] && sortedAntennaeInput[1] === factorInfo.pairs[0][1]) {
        newCorrectness.antennae = [true, true];
    }

    const remainingPairs = [...factorInfo.pairs.slice(1)];
    const userInputLegs = userInputs.legs.map(p => [parseInt(p[0]), parseInt(p[1])].sort((a,b)=>a-b));

    userInputLegs.forEach((userPair, index) => {
        const foundIndex = remainingPairs.findIndex(actualPair => actualPair[0] === userPair[0] && actualPair[1] === userPair[1]);
        if(foundIndex !== -1) {
            newCorrectness.legs[index] = [true, true];
            remainingPairs.splice(foundIndex, 1);
        } else {
            newCorrectness.legs[index] = [false, false];
        }
    });

    if (factorInfo.stinger !== null && userInputs.stinger !== null) {
        newCorrectness.stinger = parseInt(userInputs.stinger) === factorInfo.stinger;
    }

    setCorrectness(newCorrectness);
    setShowAnswers(true);
  };

  const checkCreativeAnswers = () => {
    if (!creativeFactorInfo || !creativeInputs) return;

    // Step 1: Check the bug's structure
    const correctLegPairs = creativeFactorInfo.pairs.length - 1;
    const correctHasStinger = creativeFactorInfo.stinger !== null;
    const userLegPairs = creativeInputs.legs.length;
    const userHasStinger = creativeInputs.stinger !== null;

    if (correctLegPairs !== userLegPairs || correctHasStinger !== userHasStinger) {
        let message = "The bug's shape isn't quite right. ";
        if (correctLegPairs !== userLegPairs) {
            message += `It should have ${correctLegPairs} pair(s) of legs. `;
        }
        if (correctHasStinger !== userHasStinger) {
            message += correctHasStinger ? "It needs a stinger." : "It shouldn't have a stinger.";
        }
        setCreativeMessage(message);
        setShowCreativeAnswers(false);
        setCreativeCorrectness(null);
        return;
    }

    // Step 2: If structure is correct, check the factor values
    const newCorrectness: CorrectnessState = {
        antennae: [false, false],
        legs: Array(creativeFactorInfo.pairs.length - 1).fill(null).map(() => [false, false]),
        stinger: null
    };

    const sortedAntennaeInput = [parseInt(creativeInputs.antennae[0]), parseInt(creativeInputs.antennae[1])].sort((a,b) => a-b);
    if(sortedAntennaeInput[0] === creativeFactorInfo.pairs[0][0] && sortedAntennaeInput[1] === creativeFactorInfo.pairs[0][1]) {
        newCorrectness.antennae = [true, true];
    }

    const remainingPairs = [...creativeFactorInfo.pairs.slice(1)];
    const userInputLegs = creativeInputs.legs.map(p => [parseInt(p[0]), parseInt(p[1])].sort((a,b)=>a-b));

    userInputLegs.forEach((userPair, index) => {
        const foundIndex = remainingPairs.findIndex(actualPair => actualPair[0] === userPair[0] && actualPair[1] === userPair[1]);
        if(foundIndex !== -1) {
            newCorrectness.legs[index] = [true, true];
            remainingPairs.splice(foundIndex, 1);
        } else {
            newCorrectness.legs[index] = [false, false];
        }
    });

    if (creativeFactorInfo.stinger !== null && creativeInputs.stinger !== null) {
        newCorrectness.stinger = parseInt(creativeInputs.stinger) === creativeFactorInfo.stinger;
    }
    
    setCreativeCorrectness(newCorrectness);
    setShowCreativeAnswers(true);

    const isFullyCorrect = 
        newCorrectness.antennae.every(v => v) &&
        newCorrectness.legs.every(p => p && p.every(v => v)) &&
        (creativeFactorInfo.stinger === null || newCorrectness.stinger);
    
    if (isFullyCorrect) {
        setCreativeMessage(`Success! You correctly built the factor bug for ${creativeNumber}!`);
    } else {
        setCreativeMessage(`The factors aren't quite right. Keep trying!`);
    }
  };

  const handleCreativeBugBuild = (action: 'addLeg' | 'removeLeg' | 'toggleStinger') => {
    if (!creativeInputs) return;
    const newInputs = {...creativeInputs};
    if (action === 'addLeg') {
        newInputs.legs.push(['', '']);
    } else if (action === 'removeLeg' && newInputs.legs.length > 0) {
        newInputs.legs.pop();
    } else if (action === 'toggleStinger') {
        newInputs.stinger = newInputs.stinger === null ? '' : null;
    }
    setCreativeInputs(newInputs);
    // Reset correctness when structure changes
    setCreativeCorrectness(null);
    setShowCreativeAnswers(false);
    setCreativeMessage('');
  };


  const renderContent = () => {
    switch(mode) {
      case GameMode.Watch:
        return (
            <>
            <NumberSelector onSelect={handleNumberSelect} selected={selectedNumber} />
            {factorInfo && <FactorBug key={factorInfo.number} factorInfo={factorInfo} mode={GameMode.Watch} animationStep={animationStep} />}
            </>
        );
      case GameMode.Guided:
        return (
            <>
            <NumberSelector onSelect={handleNumberSelect} selected={selectedNumber} />
            {factorInfo && userInputs && (
                <>
                <p className="text-center text-gray-600 mt-4 max-w-xl mx-auto">This is the bug for {selectedNumber}. Can you find all its factor pairs? Use divisibility rules to help!</p>
                <div className="relative w-full">
                    <FactorBug
                        factorInfo={factorInfo}
                        mode={GameMode.Guided}
                        userInputs={userInputs}
                        onInputChange={handleInputChange}
                        correctness={correctness}
                        showAnswers={showAnswers}
                    />
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                        <button onClick={checkGuidedAnswers} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors">
                            Check My Answers
                        </button>
                    </div>
                </div>
                </>
            )}
            </>
        );
      case GameMode.Creative:
        return (
            <div className="w-full">
                 <p className="text-center text-gray-600 mb-4 max-w-xl mx-auto">
                    A wild factor bug for the number {creativeNumber} appeared! First, build its body, then find its factors.
                 </p>
                 {creativeFactorInfo && creativeInputs && (
                    <>
                    <div className="flex justify-center items-center space-x-4 mb-4 p-3 bg-white/60 rounded-lg shadow-md">
                        <span className="font-semibold text-gray-700">Build the Bug:</span>
                        <button onClick={() => handleCreativeBugBuild('addLeg')} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm">+ Add Leg Pair</button>
                        <button onClick={() => handleCreativeBugBuild('removeLeg')} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm" disabled={creativeInputs.legs.length === 0}>- Remove Leg Pair</button>
                        <button onClick={() => handleCreativeBugBuild('toggleStinger')} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors shadow-sm">Toggle Stinger</button>
                    </div>
                    <div className="relative w-full">
                        <FactorBug
                            mode={GameMode.Creative}
                            factorInfo={creativeFactorInfo}
                            userInputs={creativeInputs}
                            onInputChange={handleInputChange}
                            correctness={creativeCorrectness}
                            showAnswers={showCreativeAnswers}
                            onNumberClick={generateNewCreativeBug}
                        />
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <button onClick={checkCreativeAnswers} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors">
                                Check My Answers
                            </button>
                            {creativeMessage && <p className="mt-4 text-center font-semibold text-lg">{creativeMessage}</p>}
                        </div>
                    </div>
                    </>
                 )}
            </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 text-gray-800 font-sans flex flex-col items-center pt-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-green-800 tracking-tight">Factor Bugs</h1>
        <p className="text-lg text-gray-600 mt-2">A fun way to learn about factors!</p>
      </header>
      <ModeSelector onSelect={handleModeSelect} selected={mode} />
      <main className="w-full max-w-4xl mt-8 flex flex-col items-center space-y-6">
        {renderContent()}
      </main>
       <footer className="py-6 mt-auto text-center text-gray-500 text-sm">
        <p>Built by a world-class React engineer.</p>
      </footer>
    </div>
  );
}