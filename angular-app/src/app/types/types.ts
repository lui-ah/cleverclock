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