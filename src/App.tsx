import React, { useState, useEffect, useCallback } from 'react';
import type { FactorInfo, UserInputState, CorrectnessState } from '@/types';
import { GameMode, NumberType } from '@/types';
import { FactorBug } from '@/components/FactorBug';
import { ScoreBug } from '@/components/ScoreBug';

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
  if (pairs.length === 1 && stinger === null && num !== 1) {
    type = NumberType.Prime;
  } else if (stinger !== null) {
    type = NumberType.Square;
  }
  
  // Special case for number 1
  if (num === 1) {
    type = NumberType.Square;
    stinger = 1; // It's its own square root
    pairs.length = 0; // No pairs, just a stinger
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
  const [mode, setMode] = useState<GameMode>(GameMode.Guided);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(12);
  const [factorInfo, setFactorInfo] = useState<FactorInfo | null>(null);
  const [animationStep, setAnimationStep] = useState(0);

  // Score
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [completedBugs, setCompletedBugs] = useState<number[]>([]);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

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

  // Effect to handle MODE CHANGE
  useEffect(() => {
    // Reset session-wide state
    setScore(0);
    setErrors(0);
    setCompletedBugs([]);

    // Reset bug-specific state
    setAnimationStep(0);
    setCorrectness(null);
    setShowAnswers(false);
    setCreativeCorrectness(null);
    setShowCreativeAnswers(false);
    setCreativeMessage('');
    setFactorInfo(null);
    setUserInputs(null);

    // Setup for new mode
    if (mode === GameMode.Creative) {
      setCreativeNumber(null); // Ensure a new bug is generated
      generateNewCreativeBug();
    } else {
      // Reset creative state when leaving creative mode
      setCreativeNumber(null);
      setCreativeFactorInfo(null);
      setCreativeInputs(null);
      setSelectedNumber(mode === GameMode.Watch ? 7 : 12);
    }
  }, [mode, generateNewCreativeBug]);

  // Effect to handle NUMBER CHANGE (for Watch & Guided modes)
  useEffect(() => {
    if (mode === GameMode.Watch || mode === GameMode.Guided) {
      if (selectedNumber) {
        const info = calculateFactorInfo(selectedNumber);
        setFactorInfo(info);
        
        // Reset state for the new number puzzle
        setAnimationStep(0);
        setCorrectness(null);
        setShowAnswers(false);

        if (mode === GameMode.Watch) {
          const totalSteps = info.pairs.length + (info.stinger ? 1 : 0);
          const interval = setInterval(() => {
            setAnimationStep(prev => (prev < totalSteps ? prev + 1 : prev));
          }, 700);
          return () => clearInterval(interval);
        } else if (mode === GameMode.Guided) {
          setUserInputs({
            antennae: ['', ''],
            legs: Array(Math.max(0, info.pairs.length - 1)).fill(['', '']),
            stinger: info.stinger !== null ? '' : null,
          });
        }
      } else {
        setFactorInfo(null);
        setUserInputs(null);
      }
    }
  }, [mode, selectedNumber]);

  // Effect to trigger congrats modal
  useEffect(() => {
    if (score === 10) {
      if (mode === GameMode.Guided || mode === GameMode.Creative) {
        setShowCongratsModal(true);
      }
    }
  }, [score, mode]);


  const handleNumberSelect = (num: number) => {
    setSelectedNumber(num);
  };
  
  const handleModeSelect = (newMode: GameMode) => {
    setMode(newMode);
    // Set a default number for watch mode, clear for others.
    setSelectedNumber(newMode === GameMode.Watch ? 7 : null); 
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
    if (!factorInfo || !userInputs || !selectedNumber) return;

    if (completedBugs.includes(selectedNumber)) return;

    const hasAntennae = factorInfo.pairs.length > 0;

    const newCorrectness: CorrectnessState = {
        antennae: hasAntennae ? [false, false] : null,
        legs: Array(Math.max(0, factorInfo.pairs.length - 1)).fill(null).map(() => [false, false]),
        stinger: null
    };

    if (hasAntennae) {
        const sortedAntennaeInput = [parseInt(userInputs.antennae[0]), parseInt(userInputs.antennae[1])].sort((a,b) => a-b);
        if(sortedAntennaeInput[0] === factorInfo.pairs[0][0] && sortedAntennaeInput[1] === factorInfo.pairs[0][1]) {
            newCorrectness.antennae = [true, true];
        }
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
    
    const antennaeCorrect = !hasAntennae || (newCorrectness.antennae?.every(v => v) ?? false);
    const isFullyCorrect =
      antennaeCorrect &&
      newCorrectness.legs.every(p => p && p.every(v => v)) &&
      (factorInfo.stinger === null || newCorrectness.stinger === true);

    if (isFullyCorrect) {
        setScore(s => s + 1);
        setCompletedBugs(prev => [...prev, selectedNumber]);
    } else {
        setErrors(e => e + 1);
    }

    setCorrectness(newCorrectness);
    setShowAnswers(true);
  };

  const checkCreativeAnswers = () => {
    if (!creativeFactorInfo || !creativeInputs || !creativeNumber) return;

    if (completedBugs.includes(creativeNumber)) {
        setCreativeMessage(`You already solved this one! Click the number to get a new bug.`);
        return;
    }

    // Step 1: Check the bug's structure
    const correctLegPairs = Math.max(0, creativeFactorInfo.pairs.length - 1);
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
        setErrors(e => e + 1);
        setShowCreativeAnswers(false);
        setCreativeCorrectness(null);
        return;
    }

    // Step 2: If structure is correct, check the factor values
    const hasAntennae = creativeFactorInfo.pairs.length > 0;
    const newCorrectness: CorrectnessState = {
        antennae: hasAntennae ? [false, false] : null,
        legs: Array(Math.max(0, creativeFactorInfo.pairs.length - 1)).fill(null).map(() => [false, false]),
        stinger: null
    };

    if (hasAntennae) {
        const sortedAntennaeInput = [parseInt(creativeInputs.antennae[0]), parseInt(creativeInputs.antennae[1])].sort((a,b) => a-b);
        if(sortedAntennaeInput[0] === creativeFactorInfo.pairs[0][0] && sortedAntennaeInput[1] === creativeFactorInfo.pairs[0][1]) {
            newCorrectness.antennae = [true, true];
        }
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

    const antennaeCorrect = !hasAntennae || (newCorrectness.antennae?.every(v => v) ?? false);
    const isFullyCorrect = 
        antennaeCorrect &&
        newCorrectness.legs.every(p => p && p.every(v => v)) &&
        (creativeFactorInfo.stinger === null || newCorrectness.stinger);
    
    if (isFullyCorrect) {
        setCreativeMessage(`Success! You correctly built the factor bug for ${creativeNumber}!`);
        setScore(s => s + 1);
        setCompletedBugs(prev => [...prev, creativeNumber]);
    } else {
        setCreativeMessage(`The factors aren't quite right. Keep trying!`);
        setErrors(e => e + 1);
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

  const renderBugTypeExplanation = (factorInfo: FactorInfo) => {
    let title = '';
    let explanation = '';
    let colors = '';

    switch (factorInfo.type) {
      case NumberType.Prime:
        title = "It's a Factor Slug!";
        explanation = "Prime numbers have only one factor pair: 1 and the number itself. That's why this is a 'Factor Slug' with just antennae and no legs!";
        colors = 'bg-green-100/50 border-green-300 text-green-800';
        break;
      case NumberType.Square:
        title = "It's a Factor Bee!";
        explanation = "Square numbers have an odd number of total factors because one factor multiplies by itself. This special factor is shown on the stinger, making it a 'Factor Bee'!";
        colors = 'bg-yellow-100/50 border-yellow-300 text-yellow-800';
        break;
      case NumberType.Composite:
      default:
        title = "It's a Factor Bug!";
        explanation = "Composite numbers have more than two factors. Factors come in pairs, which is why this 'Factor Bug' has antennae for its first factor pair and legs for any others.";
        colors = 'bg-green-100/50 border-green-300 text-green-800';
        break;
    }
    return (
      <div className={`mt-2 mb-2 p-4 rounded-lg border ${colors}`}>
        <h4 className="font-bold">{title}</h4>
        <p className="text-sm">{explanation}</p>
      </div>
    );
  };

  const renderContent = () => {
    switch(mode) {
      case GameMode.Watch:
        return (
            <>
              <NumberSelector onSelect={handleNumberSelect} selected={selectedNumber} />
              {factorInfo && (
                <div className="w-full flex flex-col md:flex-row items-start justify-center gap-4 mt-4">
                  <div className="w-full md:w-1/2 flex justify-center">
                    <FactorBug key={factorInfo.number} factorInfo={factorInfo} mode={GameMode.Watch} animationStep={animationStep} />
                  </div>
                  <div className="w-full md:w-1/2 p-4">
                    {(() => {
                      const allPairs = [...factorInfo.pairs];
                      if (factorInfo.stinger) {
                          allPairs.push([factorInfo.stinger, factorInfo.stinger]);
                      }
                      allPairs.sort((a, b) => a[0] - b[0]);

                      const allFactors = Array.from(new Set(allPairs.flat())).sort((a, b) => a - b);
                      return (
                        <div className="p-6 bg-white/70 rounded-lg shadow-lg">
                          <h3 className="text-2xl font-bold text-green-700 mb-4">Finding the factors of {factorInfo.number}</h3>
                          <p className="text-gray-600 mb-4">
                            We find factors by checking for divisibility. We start with 1 and work our way up. For each number that divides exactly into {factorInfo.number}, we find a factor pair.
                          </p>
                           {renderBugTypeExplanation(factorInfo)}
                          <div className="space-y-2 mb-4 font-mono text-lg bg-green-50/50 p-3 rounded-md border border-green-200">
                            {allPairs.map((pair, index) => (
                              <p key={index} className="flex justify-between px-2">
                                <span>{pair[0]} &times; {pair[1]}</span>
                                <span>=</span>
                                <span>{factorInfo.number}</span>
                              </p>
                            ))}
                          </div>
                          <p className="text-gray-700 font-semibold mt-4">
                            So the factors of {factorInfo.number} are: <span className="font-bold text-green-800">{allFactors.join(', ')}</span>.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
        );
      case GameMode.Guided:
        return (
            <>
            <NumberSelector onSelect={handleNumberSelect} selected={selectedNumber} />
            {factorInfo && userInputs && (
                <div className="flex flex-col items-center">
                  <p className="text-center text-gray-600 my-2 mx-auto max-w-md">This is the bug for {selectedNumber}. Can you find all its factor pairs? Use divisibility rules to help!</p>
                  <div className="relative w-full">
                      <FactorBug
                          factorInfo={factorInfo}
                          mode={GameMode.Guided}
                          userInputs={userInputs}
                          onInputChange={handleInputChange}
                          correctness={correctness}
                          showAnswers={showAnswers}
                      />
                  </div>
                  <div className="mt-4">
                      <button onClick={checkGuidedAnswers} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors">
                          Check My Answers
                      </button>
                  </div>
                </div>
            )}
            </>
        );
      case GameMode.Creative:
        return (
            <div className="w-full">
                 <p className="text-center text-gray-600 mb-2 mx-auto">
                    A wild factor bug for the number {creativeNumber} appeared! First, build its body, then find its factors.
                 </p>
                 {creativeFactorInfo && creativeInputs && (
                    <div className="flex flex-col items-center">
                      <div className="flex justify-center items-center space-x-4 mb-2 p-3 bg-white/60 rounded-lg shadow-md">
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
                      </div>
                      <div className="mt-4 flex flex-col items-center">
                          <button onClick={checkCreativeAnswers} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors">
                              Check My Answers
                          </button>
                          {creativeMessage && <p className="mt-4 text-center font-semibold text-lg">{creativeMessage}</p>}
                      </div>
                    </div>
                 )}
            </div>
        );
      default:
        return null;
    }
  };

  const renderCongratsModal = () => {
    const handleCloseAndResetCreative = () => {
      setScore(0);
      setErrors(0);
      setCompletedBugs([]);
      setShowCongratsModal(false);
    };

    const handleSwitchMode = () => {
      setShowCongratsModal(false);
      // Reset score before switching modes to prevent re-triggering modal
      setScore(0);
      setErrors(0);
      setCompletedBugs([]);
      handleModeSelect(GameMode.Creative);
    };

    const handleKeepPracticing = () => {
      setShowCongratsModal(false);
    };

    const modalContent = {
      [GameMode.Guided]: {
        title: "Congratulations!",
        message: "You've mastered 10 bugs! Ready for a new challenge? Move on to Creative Mode to test your skills!",
        buttons: (
          <>
            <button onClick={handleSwitchMode} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors">
              Go to Creative Mode
            </button>
            <button onClick={handleKeepPracticing} className="px-6 py-2 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-colors">
              Keep Practising
            </button>
          </>
        ),
      },
      [GameMode.Creative]: {
        title: "You're a Bug Master!",
        message: "Wow! You've solved 10 factor bugs! You're a true bug master! Your score will now reset so you can play again.",
        buttons: (
          <button onClick={handleCloseAndResetCreative} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors">
            Play Again
          </button>
        ),
      },
      [GameMode.Watch]: null,
    };

    const currentContent = modalContent[mode];

    return (
      <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${showCongratsModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-amber-50 rounded-2xl p-8 shadow-2xl max-w-md w-full text-center transform transition-all duration-300 ${showCongratsModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {currentContent && (
            <>
              <h2 className="text-3xl font-bold text-green-800 mb-4">{currentContent.title}</h2>
              <p className="text-lg text-gray-700 mb-8">{currentContent.message}</p>
              <div className="flex justify-center space-x-4">
                {currentContent.buttons}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-amber-50 text-gray-800 font-sans flex flex-col items-center pt-4 px-4">
      {renderCongratsModal()}
      <header className={`w-full max-w-4xl flex items-center mb-4 ${mode === GameMode.Watch ? 'justify-center' : 'justify-between'}`}>
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 tracking-tight">Factor Bugs</h1>
          <p className="text-lg text-gray-600">A fun way to learn about factors!</p>
        </div>
        {(mode === GameMode.Guided || mode === GameMode.Creative) && (
          <ScoreBug score={score} errors={errors} />
        )}
      </header>

      <ModeSelector onSelect={handleModeSelect} selected={mode} />

      <main className="w-full max-w-4xl mt-4 flex flex-col items-center">
        {renderContent()}
      </main>
      
       <footer className="py-2 mt-auto text-center text-gray-500 text-sm">
        <p>Built by a world-class React engineer.</p>
      </footer>
    </div>
  );
}