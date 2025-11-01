export enum GameMode {
  Watch = 1,
  Guided = 2,
  Creative = 3,
}

export enum NumberType {
  Prime = 'Prime',
  Composite = 'Composite',
  Square = 'Square',
}

export interface FactorInfo {
  number: number;
  type: NumberType;
  pairs: [number, number][];
  stinger: number | null;
}

export interface UserInputState {
  antennae: [string, string];
  legs: [string, string][];
  stinger: string | null;
}

export interface CorrectnessState {
  antennae: [boolean, boolean] | null;
  legs: ([boolean, boolean] | null)[];
  stinger: boolean | null;
}