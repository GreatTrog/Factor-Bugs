import React from 'react';
import type { FactorInfo, UserInputState, CorrectnessState } from '@/types';
import { GameMode, NumberType } from '@/types';

type FactorBugProps = {
  mode: GameMode;
  factorInfo?: FactorInfo;
  animationStep?: number;
  userInputs?: UserInputState;
  onInputChange?: (type: 'antennae' | 'legs' | 'stinger', index: number, subIndex: number, value: string) => void;
  correctness?: CorrectnessState | null;
  showAnswers?: boolean;
  onNumberClick?: () => void;
};

const getInputClass = (isCorrect: boolean | null | undefined, showAnswers: boolean) => {
    if (!showAnswers || isCorrect === null || isCorrect === undefined) {
        return 'border-gray-400 bg-amber-100 focus:border-green-500 focus:ring-green-500';
    }
    return isCorrect ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100';
};

const FactorPart: React.FC<{ value: string | number, className?: string, rotation?: number }> = ({ value, className, rotation = 0 }) => (
    <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-amber-200 rounded-full border-2 border-amber-400 shadow ${className}`}>
        <span style={{ transform: `rotate(${-rotation}deg)` }} className="block text-sm md:text-base font-bold text-gray-700">
            {value}
        </span>
    </div>
);


const FactorInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputClassName?: string;
  rotation?: number;
}> = ({ value, onChange, inputClassName, rotation = 0 }) => (
  <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12`}>
    <input
      type="number"
      value={value}
      onChange={onChange}
      style={{ transform: `rotate(${-rotation}deg)` }}
      className={`w-full h-full text-center font-bold rounded-full border-2 transition-colors ${inputClassName}`}
      min="1"
      max="100"
    />
  </div>
);

const BugAppendage: React.FC<{
    mode: GameMode,
    isCreative: boolean,
    value: string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    rotation: number,
    stalkLength: string,
    stalkColorClass: string,
    correctnessValue?: boolean | null,
    showAnswers?: boolean
}> = ({mode, isCreative, value, onChange, rotation, stalkLength, stalkColorClass, correctnessValue, showAnswers = false}) => {
    return (
         <div className="flex items-center">
            <div className={`h-0.5 ${stalkColorClass}`} style={{width: stalkLength}}/>
            {(mode === GameMode.Guided || isCreative) ? (
                <FactorInput
                    value={String(value)}
                    onChange={onChange}
                    rotation={rotation}
                    inputClassName={getInputClass(correctnessValue, showAnswers)}
                />
            ) : (
                 <FactorPart value={value} rotation={rotation} />
            )}
        </div>
    )
}


export const FactorBug: React.FC<FactorBugProps> = ({
  mode,
  factorInfo,
  animationStep = 0,
  userInputs,
  onInputChange = (_type, _index, _subIndex, _value) => {},
  correctness,
  showAnswers = false,
  onNumberClick,
}) => {
    const isCreative = mode === GameMode.Creative;

    const number = factorInfo?.number;
    const bugType = factorInfo?.type;

    // Show the number in Guided and Creative modes even for primes
    const bodyText = (mode === GameMode.Watch && bugType === NumberType.Prime) ? '' : number;

    const bodyShapeClass = bugType === NumberType.Prime
        ? 'h-48 w-24 rounded-[50%]' // Slug
        : 'h-48 w-48 rounded-full'; // Bug/Bee

    const bodyColorClass = bugType === NumberType.Square ? 'bg-yellow-400 border-yellow-600' : 'bg-green-400 border-green-600';
    const stalkColorClass = bugType === NumberType.Square ? 'bg-yellow-600' : 'bg-green-600';


    const getPairs = () => {
        if(!factorInfo) return { antennaePair: undefined, legPairs: [], stingerValue: null };
        const hasPairs = factorInfo.pairs && factorInfo.pairs.length > 0;
        return {
            antennaePair: hasPairs ? factorInfo.pairs[0] : undefined,
            legPairs: hasPairs ? factorInfo.pairs.slice(1) : [],
            stingerValue: factorInfo.stinger
        };
    };

    const { antennaePair, legPairs, stingerValue } = getPairs();

    const renderAntennae = () => {
        if (!antennaePair) return null;

        const isVisible = mode !== GameMode.Watch || animationStep > 0;
        const transformBase = 'transition-all duration-500';
        const hidden = isVisible ? 'opacity-100' : 'opacity-0 scale-50';

        const angles = [-120, -60];
        const headRadius = '4.0rem';
        const numberDistance = '6.5rem';
        const circleRadius = '1.25rem';
        const stalkLength = `calc(${numberDistance} - ${headRadius} - ${circleRadius})`;

        return angles.map((angle, index) => {
            const rotationStyle = { transform: `translate(-50%, -50%) rotate(${angle}deg)` };
            const pusherStyle = { transform: `translateX(${headRadius})` };

            const value = (mode === GameMode.Guided || isCreative) ? userInputs!.antennae[index] : antennaePair[index];
            const correctnessValue = correctness?.antennae?.[index];

            return (
                 <div key={index} className={`absolute top-1/2 left-1/2 ${transformBase} ${hidden}`} style={rotationStyle}>
                    <div style={pusherStyle}>
                        <BugAppendage
                            mode={mode}
                            isCreative={isCreative}
                            value={value}
                            onChange={(e) => onInputChange('antennae', 0, index, e.target.value)}
                            rotation={angle}
                            stalkLength={stalkLength}
                            stalkColorClass={stalkColorClass}
                            correctnessValue={correctnessValue}
                            showAnswers={showAnswers}
                        />
                    </div>
                 </div>
            );
        });
    };

    const renderLegs = () => {
        // In creative mode, the structure is defined by userInputs. In others, by factorInfo.
        const legArrayForRendering = (isCreative && userInputs) ? userInputs.legs : legPairs;
        const numLegPairs = legArrayForRendering.length;
        if (numLegPairs === 0) return null;

        const rightAngleStart = -50;
        const rightAngleEnd = 50;
        const angleSpan = rightAngleEnd - rightAngleStart;
        
        const bodyRadius = '7.0rem';
        const numberDistance = '11.0rem';
        const circleRadius = '1.375rem'; 
        const stalkLength = `calc(${numberDistance} - ${bodyRadius} - ${circleRadius})`;

        return legArrayForRendering.map((_pair, index) => {
            const isVisible = mode !== GameMode.Watch || animationStep > index + 1;
            const transformBase = 'transition-all duration-500';
            const hidden = isVisible ? 'opacity-100' : 'opacity-0';

            let rightLegAngle;
            if (numLegPairs === 1) {
                rightLegAngle = 0;
            } else {
                const angleStep = angleSpan / (numLegPairs - 1);
                rightLegAngle = rightAngleStart + (index * angleStep);
            }
            const leftLegAngle = -180 - rightLegAngle;

            const styleLeft = { transform: `translate(-50%, -50%) rotate(${leftLegAngle}deg)` };
            const styleRight = { transform: `translate(-50%, -50%) rotate(${rightLegAngle}deg)` };
            const pusherStyle = { transform: `translateX(${bodyRadius})` };
            
            // In watch mode, value comes from `legPairs`.
            const watchModePair = legPairs[index];

            return (
                 <React.Fragment key={index}>
                    <div className={`absolute top-1/2 left-1/2 ${transformBase} ${hidden}`} style={styleLeft}>
                        <div style={pusherStyle}>
                            <BugAppendage
                                mode={mode}
                                isCreative={isCreative}
                                value={(mode === GameMode.Guided || isCreative) ? userInputs!.legs[index][0] : watchModePair[0]}
                                onChange={e => onInputChange('legs', index, 0, e.target.value)}
                                rotation={leftLegAngle}
                                stalkLength={stalkLength}
                                stalkColorClass={stalkColorClass}
                                correctnessValue={correctness?.legs?.[index]?.[0]}
                                showAnswers={showAnswers}
                            />
                        </div>
                    </div>
                     <div className={`absolute top-1/2 left-1/2 ${transformBase} ${hidden}`} style={styleRight}>
                        <div style={pusherStyle}>
                            <BugAppendage
                                mode={mode}
                                isCreative={isCreative}
                                value={(mode === GameMode.Guided || isCreative) ? userInputs!.legs[index][1] : watchModePair[1]}
                                onChange={e => onInputChange('legs', index, 1, e.target.value)}
                                rotation={rightLegAngle}
                                stalkLength={stalkLength}
                                stalkColorClass={stalkColorClass}
                                correctnessValue={correctness?.legs?.[index]?.[1]}
                                showAnswers={showAnswers}
                            />
                        </div>
                    </div>
                </React.Fragment>
            )
        });
    };

    const renderStinger = () => {
        const shouldRender = (isCreative && userInputs) ? userInputs.stinger !== null : stingerValue !== null;
        if (!shouldRender) return null;

        const isVisible = mode !== GameMode.Watch || animationStep > (factorInfo?.pairs.length || 0);
        const transformBase = 'transition-all duration-500';
        const hidden = isVisible ? 'opacity-100' : 'opacity-0 scale-50';
        
        const stingerContainerClass = "absolute top-full left-1/2 -translate-x-1/2 -translate-y-2 flex flex-col items-center"

        if (mode === GameMode.Guided || isCreative) {
            return (
                <div className={stingerContainerClass}>
                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-black" />
                    <FactorInput value={userInputs!.stinger || ''} onChange={e => onInputChange('stinger', 0, 0, e.target.value)}
                        inputClassName={`${getInputClass(correctness?.stinger, showAnswers)}`}
                    />
                </div>
            );
        }

        return (
            <div className={`${stingerContainerClass} ${transformBase} ${hidden}`}>
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-black" />
                <FactorPart value={stingerValue!} className="-mt-1" rotation={0} />
            </div>
        )
    }

  return (
    <div className="relative w-full h-[450px] flex justify-center pt-16">
        <div className="relative flex flex-col items-center">

            {/* Head */}
            <div className="relative w-24 h-24 mb-[-2rem] z-0">
                <div className={`relative w-full h-full rounded-full ${bodyColorClass} border-8`}>
                    {renderAntennae()}
                </div>
            </div>

            {/* Body */}
            <div className={`relative ${bodyShapeClass} ${bodyColorClass} border-8 flex items-center justify-center z-10`}>
                {bugType !== NumberType.Prime && <div className="absolute inset-4 bg-white/50 rounded-full" />}
                <div
                    onClick={isCreative ? onNumberClick : undefined}
                    className={`relative z-10 ${isCreative ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                    title={isCreative ? 'Click for a new bug!' : ''}
                >
                    <span className="text-4xl md:text-5xl font-extrabold text-black">
                        {bodyText}
                    </span>
                </div>
                
                {renderLegs()}
                {renderStinger()}
            </div>
        </div>
    </div>
  );
};
