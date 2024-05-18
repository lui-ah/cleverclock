import { Injectable, inject } from '@angular/core';
import { Firestore, collection, docData, doc, addDoc, Timestamp, updateDoc, collectionChanges, collectionData, DocumentData, deleteDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Card, ClockState, SwitchOption, SwitchOptionKeys, dbColPaths, dbDocPaths } from './types/types';
import { Functions, HttpsCallable, httpsCallable } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private firestore: Firestore = inject(Firestore); 
  private functions = inject(Functions);

  isRinging: Observable<boolean>;
  disabled: Observable<boolean>;
  nextTimer: Observable<Timestamp>;
  state: Observable<ClockState>;
  cards: Observable<Card[]>;

  wakeOptions: Observable<SwitchOption<boolean>>;

  host: string = 'http://127.0.0.1:5001/studipcal/us-central1';

  constructor() { 
    const ringingDocument = doc(this.firestore, dbDocPaths.clockState);
    const stateObservable = docData(ringingDocument) as Observable<ClockState>;

    this.state = stateObservable;

    this.isRinging = this.state.pipe(map(state => state.isRinging));
    this.disabled = this.state.pipe(map(state => state.disabled));
    this.nextTimer = this.state.pipe(map(state => state.nextTimer));

    this.wakeOptions = docData(doc(this.firestore, dbDocPaths.wakeOptions)) as Observable<SwitchOption<boolean>>;

    this.cards = collectionData(collection(this.firestore, dbColPaths.anki), {
      idField: 'generatedId',
    }) as Observable<Card[]>;    
  }

  uploadCard(card: Card) {
    delete card.generatedId; // We don't want to upload the generatedId.
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

  getCard(generatedId: string) {
    const cardRef = doc(this.firestore, dbColPaths.anki + "/" + generatedId);
    return docData(cardRef, {
      idField: 'generatedId',
    }) as Observable<Card>;
  }

  updateCard(card: Card) {
    if (!card.generatedId) {
      throw new Error('Card must have a generatedId attached to it.'); 
    } else if (card.front === '' || card.back === '') {
      throw new Error('Card must have a front and back value.'); 
    };
    const cardRef = doc(this.firestore, dbColPaths.anki + "/" + card.generatedId)
    delete card.generatedId; // We don't want to upload the generatedId.
    return updateDoc(cardRef, card);
  }

  deleteCard(card: Card) {
    console.log(card);
    if (!card.generatedId) {
      throw new Error('Card must have a generatedId attached to it.'); 
    }
    const cardRef = doc(this.firestore, dbColPaths.anki + "/" + card.generatedId);
    return deleteDoc(cardRef);
  }

  setRinging(isRinging: boolean) {
    return updateDoc(doc(this.firestore, dbDocPaths.clockState), { isRinging });
  }

  private getBase64(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string)
        .replace('data:', '')
        .replace(/^.+,/, '')
      );
      reader.onerror = reject;
    });
 }
 

  async makeRequest(file: File) {
    if(!file) {
      throw new Error('No file selected.');
    } else if (file.name.endsWith('csv')) {
      throw new Error('Not yet implemented.');
    } else if(!file.name.endsWith('.apkg')) {
      throw new Error('File must be an Anki deck.');
    }
    
    console.log(file);
    
    const addMessage = httpsCallable(this.functions, 'helloWorld');

    addMessage({
      fileBase64: await this.getBase64(file),
    }).then(result => {
        console.log(result);
      }
    )
    
  }
}
