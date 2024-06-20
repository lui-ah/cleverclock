import { Injectable, inject } from '@angular/core';
import { Firestore, collection, docData, doc, addDoc, Timestamp, updateDoc, collectionChanges, collectionData, DocumentData, deleteDoc, orderBy, getDocs, Query, CollectionReference, where, QueryConstraint, query, limit } from '@angular/fire/firestore';
import { Observable, map, tap } from 'rxjs';
import { Card, CardNoId, ClockState, FunctionsEndpoints, SwitchOption, SwitchOptionKeys, dbColPaths, dbDocPaths, SensorData } from '@custom-types/types';
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
  
  sensorData: Observable<SensorData>; // The current days sensor data every 30 minutes.
  sensorDataExtended: Observable<SensorData>; // The current days sensor data plus the previous day.
  // the extendet data is a helper to make it easier to display the previous night for example.

  temperture: Observable<number[]>; // in celsius
  tempertureExtended: Observable<number[]>; // in celsius
  humidity: Observable<number[]>; // in percent
  humidityExtended: Observable<number[]>; // in percent

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
    
    // --- begin sensor data ---

    const q = query(
      collection(
        this.firestore, dbColPaths.temperature),
        orderBy('date', 'desc'), // This means we get a new window after 24:00... which is fine.
        limit(2), // We only need the last two days.
      );
    
    this.sensorDataExtended = collectionData(q, {
      idField: 'id',
    }).pipe(map((data) => {
      const _data = data as SensorData[];
      if (_data.length === 0) {
        throw new Error('No sensor data found.');
      } else if (_data.length === 1) {
        console.error('Only one day of data found. This is not enough to display the previous day.');
        _data[0].humidity.length = 48;
        _data[0].temperature.length = 48;
        return _data[0];
      }
      

      const [today, yesterday] = _data

      today.humidity.length = 48;
      today.temperature.length = 48;
      yesterday.humidity.length = 48;
      yesterday.temperature.length = 48;

      return {
        id: _data[0].id, // We take the first ones id.
        humidity: yesterday.humidity.concat(today.humidity),
        temperature: yesterday.temperature.concat(today.temperature),
      } as SensorData;
    }));

    this.tempertureExtended = this.sensorDataExtended.pipe(map(data => data.temperature));
    this.humidityExtended = this.sensorDataExtended.pipe(map(data => data.humidity));

    this.sensorData = this.sensorDataExtended.pipe(tap(data => {
      data.humidity.splice(48);
      data.temperature.splice(48);
    }));

    this.temperture = this.sensorData.pipe(map(data => data.temperature));
    this.humidity = this.sensorData.pipe(map(data => data.humidity));

    // --- end sensor data ---
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

    const res = await addMessage({ // This might throw if billing is disabled/unavailable but also for 
      fileBase64: await this.getBase64(file),
    }).catch(err => {
      if (err.message === 'internal') {
        // If this throws, it's probably a billing error. But this is planned.
        // Billing should only be re-enabled when we present.
        // Google Cloud is awesome, but if something goes wrong...
        // I've seen some horror stories on reddit of like $15k bills,
        // because something was running in a loop. No (easy) way to set a spending limit (why?).
        // better safe than sorry.
        throw new Error('Dev Mode; Abrechnung ist wahrscheinlich deaktiviert. Schalten Sie die Abrechnung ein, um diese Funktion zu verwenden. (ggf. muss dieser Dienst auch erneut hochgefahren werden)');
      }
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
