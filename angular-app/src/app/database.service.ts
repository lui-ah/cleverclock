import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, DocumentReference, docData, getDoc, doc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { ClockState, dbDocPaths } from './types/types';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private firestore: Firestore = inject(Firestore); 
  isRinging: Observable<boolean>;
  state: Observable<ClockState>;

  constructor() { 
    const ringingDocument = doc(this.firestore, dbDocPaths.clockState);
    const stateObservable = docData(ringingDocument) as Observable<ClockState>;

    this.state = stateObservable;
    this.isRinging = this.state.pipe(map(state => state.isRinging));
  }
}
