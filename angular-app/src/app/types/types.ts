import { Timestamp } from "@angular/fire/firestore";

export interface Card {
    id: number;
    front: string;
    back: string;
    disabled: boolean;
}

export interface SwitchOption<T> {
    anki: T,
    nfc: T,
    quickOff: T,
  }
  
export interface SwitchOptionPair {
    name: string;
    value: boolean;
}

export interface ClockState {
    isOn: boolean;
    isRinging: boolean;
    disabled: boolean;
    nextTimer: Timestamp
}

export enum dbColPaths {
    anki = 'anki',
    clock = 'clock',
    temperature = 'temperature',
} 

export enum dbDocPaths {
    clockState = dbColPaths.clock + '/state',
    wakeOptions = dbColPaths.clock + '/wakeOptions',
}
