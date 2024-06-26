import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, map, take } from 'rxjs';

type ScannerConfig = {
  controller?: AbortController;
  timeout?: number;
};

export interface NfcReadingActiveEvent {
  active: true;
  controller: AbortController;
}

export interface NfcReadingInactiveEvent {
  active: false;
}

export type NfcStatusEvent = NfcReadingActiveEvent | NfcReadingInactiveEvent;

export interface NfcReadingInitializedEvent {
  message: string;
  controller: AbortController;
}

interface NfcIsActive {
  value: boolean;
  valueChanges: BehaviorSubject<NfcStatusEvent>;
}

interface NfcReadonlyIsActive {
  value: NfcIsActive["value"];
  valueChanges: NfcIsActive["valueChanges"] extends BehaviorSubject<infer T> ? Observable<T> : NfcIsActive["valueChanges"];
}

/**
   * Check if the browser supports Web NFC.
   * @returns A function that throws an error if the browser does not support Web NFC.
   */
function EnsureNfcSupport() {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Often no error is thrown if the browser does not support Web NFC.
      // This is why we have to throw an error ourselves.
      if(!("NDEFReader" in window)) throw new Error("Web NFC is not supported in this browser.");
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NfcService {
  // This is the code that we want to write to the NFC tag.
  private code = `TGFzdCBDaHJpc3RtYXM`; // Base64 of the "Last Christmas".
  // The goal here was to make to unmemorable, so that the user would have to scan the NFC tag to get the code.
  // The goal was not to make it secure.

  // Here we want to keep track of the current state of the NFC reader.
  private newController: BehaviorSubject<AbortController> = new BehaviorSubject(new AbortController());

  // This is used to keep track of the current state of the NFC reader.
  private _isActive: NfcIsActive = {
    value: false, 
    valueChanges: 
      new BehaviorSubject<NfcStatusEvent>({ active: false })
  };

  // We don't want to allow other components to emit new values. 
  // That's why we cast it to a readonly object.
  public get isActive(): NfcReadonlyIsActive {
    return this._isActive;
  }

  private set isActive(value: NfcStatusEvent) {
    this._isActive.value = value.active;
    this._isActive.valueChanges.next(value);
  }

  private async pushAbort(controller: AbortController) {
    const oldController = await firstValueFrom(this.newController.pipe(take(1)));
    // This will make sure that we only have one controller at a time.
    // Doing this synchronously is important.
    // If we don't do this we run into all kinds of timing issues.
    oldController.signal.removeEventListener('abort', () => {}); 
    // We have to remove the listener on the old controller delcared in the previous pushAbort.
    // Or we might run into issues with the isActive value due to timing issues.
    
    if(!oldController.signal.aborted) oldController.abort("Aborted by new controller."); 

    this.newController.next(controller);
    this.isActive = { active: true, controller: controller };

    controller.signal.addEventListener('abort' , () => {
      this.isActive = { active: false }; // This works, but using setNotActive does not?
    });
  }

  /**
   * Check if the browser supports Web NFC.
   * @returns true if the browser supports Web NFC, false otherwise.
   */
  supportsNfc(): boolean {
    return "NDEFReader" in window;
  }

  /**
   * Start writing to an NFC tag.
   * @param message The message to write to the tag.
   * @param options The options to pass to the scanner.
   * @returns An observable that emits the abort controller when writing is complete.
   * If the browser does not support Web NFC, it completes without emitting any value.
   * If the user denies permission, it emits an error.
   */
  @EnsureNfcSupport()
  startWriting(message: string, config?: ScannerConfig): Observable<AbortController> {
    return new Observable((subscriber) => {
      const abort = config?.controller || new AbortController(); 

      this.pushAbort(abort);

      if (config?.timeout) {
        setTimeout(() => {
          // This should be a fallback.
          subscriber.error(`Timeout: ${config.timeout}ms exceeded.`);
        }, config.timeout);
      }
      
      abort.signal.onabort = () => { 
        // has to be declared like this and not using addEventListener.
        // This won't get removed by the abort method.
        subscriber.complete();
        // This is just so we don't have any memory leaks.
        // The scanner is not active anymore anyway.
      };

      const ndef = new NDEFReader(); // Does this ask for permission?

      ndef.write(message, {overwrite: true, signal: abort.signal}).then(() => {
        subscriber.next(abort);
      }).catch((error) => {
        subscriber.error(error);
      });
      
      return () => {
        if(!abort.signal.aborted) abort.abort("Aborted by user, error or timeout.");
        // Might be necessary to abort in case of error or timeout.
      };
    });
  }

  /**
   * 
   * @param message
   * @param options
   * @param options The options to pass to the scanner.
   * @returns An observable that emits when writing is complete.
   * If the browser does not support Web NFC, it completes without emitting any value.
   * If the user denies permission, it emits an error.
   * This observable will complete after the first value is emitted.
   * This is useful for writing a single value to the NFC tag.
   */
  writeOnce(message: string, config?: ScannerConfig): Observable<void> {
    return this.startWriting(message, config).pipe(take(1), map(() => undefined));
    // This should abort automatically after the first value is emitted.
  }

    /**
   * Start reading NFC tags.
   * @returns An observable that emits the data read from the tag and the abort controller.
   * @param options The options to pass to the scanner.
   * If the browser does not support Web NFC, it completes without emitting any value.
   * If the user denies permission, it emits an error.
   */
  @EnsureNfcSupport()
  startReading(config?: ScannerConfig): Observable<NfcReadingInitializedEvent> {
    return new Observable<NfcReadingInitializedEvent>((subscriber) => {
      const abort = config?.controller || new AbortController(); 
      
      this.pushAbort(abort); // This is used to notify all OTHER instances that they should abort.
      // but will NOT trigger the firstValueFrom written below.

      // If the newController emits a new value, we should abort the previous one.
      // and complete the current observable if it is still running because
      // the reading or writing is aborted anyway.

      if (config?.timeout) {
        setTimeout(() => {
          // This should be a fallback.
          subscriber.error("Timeout:" + config.timeout + "ms exceeded.");
        }, config.timeout);
      }

      abort.signal.onabort = () => { 
        // has to be declared like this and not using addEventListener.
        // This won't get removed by the abort method.
        subscriber.complete();
        // This is just so we don't have any memory leaks.
        // The scanner is not active anymore anyway.
      };

      const ndef = new NDEFReader();
      const decoder = new TextDecoder();

      // Handle reading events
      const onReading = (event: NDEFReadingEvent) => {
        const data = decoder.decode(event.message.records[0].data);
        subscriber.next({ message: data, controller: abort });
      };

      // Set the reading event handler
      ndef.onreading = onReading;

      // Attempt to start scanning
      ndef.scan({ signal: abort.signal }).catch((error) => {
        // No types were provided for the error, bummer.
        // Handle errors (e.g., permission denied)
        subscriber.error(error);
      });

      // Handle cleanup
      return () => {
        if(!abort.signal.aborted) abort.abort();
      };
    });
  }

  /**
   * 
   * @returns An observable that emits the data read from the tag.
   * @param options The options to pass to the scanner.
   * If the browser does not support Web NFC, it completes without emitting any value.
   * If the user denies permission, it emits an error.
   * This observable will complete after the first value is emitted.
   * This is useful for reading a single value from the NFC tag.
   */
  readOnce(config?: ScannerConfig): Observable<string>{
    return this.startReading(config).pipe(take(1), map((value) => value.message));
    // If we only take one, we don't care about the abort controller.
    // This should abort automatically after the first value is emitted.
  }


  /**
   * 
   * @returns An observable that emits true if the code on the NFC tag matches the expected code.
   * @param options The options to pass to the scanner.
   * If the browser does not support Web NFC, it completes without emitting any value.
   * If the user denies permission, it emits an error.
   */
  matchesCode(config?: ScannerConfig): Observable<boolean> {
    return this.readOnce(config).pipe(take(1), map((data) => data === this.code));
  }

  writeCode(config?: ScannerConfig): Observable<void> {
    return this.writeOnce(this.code, config);
  }
}
