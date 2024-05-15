import { Injectable, inject } from '@angular/core';
import { Firestore, collection, docData, doc, addDoc, Timestamp, updateDoc, collectionChanges, collectionData, DocumentData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Card, ClockState, SwitchOption, SwitchOptionKeys, dbColPaths, dbDocPaths } from './types/types';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private firestore: Firestore = inject(Firestore); 
  isRinging: Observable<boolean>;
  disabled: Observable<boolean>;
  nextTimer: Observable<Timestamp>;
  state: Observable<ClockState>;
  cards: Observable<Card[]>;

  wakeOptions: Observable<SwitchOption<boolean>>;

  constructor() { 
    const ringingDocument = doc(this.firestore, dbDocPaths.clockState);
    const stateObservable = docData(ringingDocument) as Observable<ClockState>;

    this.state = stateObservable;

    this.isRinging = this.state.pipe(map(state => state.isRinging));
    this.disabled = this.state.pipe(map(state => state.disabled));
    this.nextTimer = this.state.pipe(map(state => state.nextTimer));

    this.wakeOptions = docData(doc(this.firestore, dbDocPaths.wakeOptions)) as Observable<SwitchOption<boolean>>;

    this.cards = collectionData(collection(this.firestore, dbColPaths.anki)) as Observable<Card[]>;    
  }

  uploadCard(card: Card) {
    const cardCollection = collection(this.firestore, dbColPaths.anki);
    return addDoc(cardCollection, card);
  }

  setNextTimer(ts: Timestamp | Date) {
    if (ts instanceof Date) {
      ts = Timestamp.fromDate(ts);
    }
    return updateDoc(doc(this.firestore, dbDocPaths.clockState), { nextTimer: ts });
  }

  setWakeOptions(options: SwitchOption<boolean>) {
    return updateDoc(doc(this.firestore, dbDocPaths.wakeOptions), { ...options });
  }
  setWakeOption(option: SwitchOptionKeys, value: boolean) {
    return updateDoc(
      doc(this.firestore, dbDocPaths.wakeOptions),
      { [option]: value }
    );
  }
}
