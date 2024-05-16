import { DocumentData, Timestamp } from "@angular/fire/firestore";

export interface Card extends DocumentData {
    id: number;
    front: string;
    back: string;
    disabled: boolean;
}

export interface SwitchOption<T> {
    anki: T,
    nfc: T,
    quickOff: T,
    // tasksNumber? : number, // maybe add this later.s
}

export type SwitchOptionKeys = keyof SwitchOption<any>; 


export interface ClockState {
    // isOn: boolean; // maybe add this later with a heartbeat.
    isRinging: boolean;
    disabled: boolean;
    nextTimer: Timestamp
}

// These should reduce the number of typos in the code.
export enum dbColPaths {
    anki = 'anki',
    clock = 'clock',
    temperature = 'temperature',
} 

export enum dbDocPaths {
    clockState = dbColPaths.clock + '/state',
    wakeOptions = dbColPaths.clock + '/wakeOptions',
}
