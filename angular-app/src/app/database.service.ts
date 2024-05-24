import { Injectable, inject } from '@angular/core';
import { Firestore, collection, docData, doc, addDoc, Timestamp, updateDoc, collectionChanges, collectionData, DocumentData, deleteDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Card, CardNoId, ClockState, FunctionsEndpoints, SwitchOption, SwitchOptionKeys, dbColPaths, dbDocPaths } from './types/types';
import { Functions, httpsCallable } from '@angular/fire/functions';

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
      idField: 'id',
    }) as Observable<Card[]>;    
  }

  uploadCard(card: Card | CardNoId) {
    // We also have CardNoId.
    delete (card as Omit<Card, 'id'>)['id']; // We don't want to upload the generatedId.
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

  getCard(id: number) {
    const cardRef = doc(this.firestore, dbColPaths.anki + "/" + id);
    return docData(cardRef, {
      idField: 'id',
    }) as Observable<Card>;
  }

  updateCard(card: Card) {
    if (!card.id) {
      throw new Error('Card must have a id attached to it.'); 
    } else if (card.front === '' || card.back === '') {
      throw new Error('Card must have a front and back value.'); 
    };
    const cardRef = doc(this.firestore, dbColPaths.anki + "/" + card.id)
    delete (card as Omit<Card, 'id'>)['id']; // We don't want to upload the generatedId.
    return updateDoc(cardRef, card);
  }

  deleteCard(card: Card) {
    console.log(card);
    if (!card.id) {
      throw new Error('Card must have a id attached to it.'); 
    }
    const cardRef = doc(this.firestore, dbColPaths.anki + "/" + card.id);
    return deleteDoc(cardRef);
  }

  setRinging(isRinging: boolean) {
    return updateDoc(doc(this.firestore, dbDocPaths.clockState), { isRinging });
  }

  private getBase64(file: File): Promise<string> {
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
 

  async getCards(file: File): Promise<CardNoId[]>  {

    if(!file) {
      throw new Error('Keine Datei ausgewählt.');
    } else if (file.name.endsWith('csv')) {
      throw new TypeError('CSV nicht implementiert. Es werden nur .apkg Dateien unterstützt.');
    } else if(!file.name.endsWith('.apkg')) {
      throw new TypeError('Es werden nur .apkg Dateien unterstützt.');
    }
    
    const addMessage = httpsCallable<{fileBase64: string},  { cards: string[] }>(this.functions, FunctionsEndpoints.getCards);

    const res = await addMessage({
      fileBase64: await this.getBase64(file),
    }).catch(err => {
      throw new Error(err.message);
    });

    const cardStrings = res.data.cards;

    const cards = cardStrings.map(
      card => {
        // Format: "absoluto (adj)<img src="paste-4562608183050241.jpg" />absolute"
        // or: "absoluto (adj)absolute"
        const fields = card.split(''); // Unicode U+001F // turn out, that is called INFORMATION SEPARATOR ONE. Because commas would be too easy.
        const [front, backOrImage, backOrUndefined] = fields; // if there is no image, the back is the last field.
        // The order and formatting is prob specified in some table, but this is just a demo.

        const back = backOrUndefined ? backOrUndefined : backOrImage;

        return {
          front,
          disabled: false,
          back,
        } as CardNoId;
      }
    ).filter(card => card.front && card.back); // Filter out empty cards. (There are some in the demo file.

    if (cards.length === 0) {
      throw new Error('Die Datei enthält keine Karten.');
    } else if (cards.length > 30) {
      throw new Error('Die Datei enthält zu viele Karten. Bitte wählen Sie eine Datei mit max 30 Karten.');
    }

    return cards;
  }
}
