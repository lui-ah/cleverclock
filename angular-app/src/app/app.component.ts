import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { DatabaseService } from './database.service';
import { Observable, Subscription, filter, map, switchMap, tap } from 'rxjs';
import { useDev } from './app.config';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { AsyncPipe } from '@angular/common';
import { NfcService, NfcStatusEvent, NfcReadingActiveEvent } from './nfc.service';
import {MatSnackBar, MatSnackBarModule, MatSnackBarRef} from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatProgressBarModule, AsyncPipe, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isRingingSubscription: Subscription;
  scanningSubscription: Subscription;
  routerEventSubscription: Subscription;
  controller: AbortController = new AbortController();

  isScanning: Observable<boolean>;
  
  constructor(dataBaseService: DatabaseService, router: Router, titleService: Title, public nfc: NfcService, _snackBar: MatSnackBar) {
    // This is used to display the progress bar when the NFC reader is active.
    // TODO: We have the snackbar for that. We should consider removing this.
    this.isScanning = nfc.isActive.valueChanges.pipe(map(event => event.active));

    // Helper function for the filter function.
    const isReadingActiveEvent = (event: NfcStatusEvent): event is NfcReadingActiveEvent => event.active;

    let snackBarRef: MatSnackBarRef<any> | null = null;

    // This is used to display a message when the NFC reader is active.
    const displayMessage = switchMap((value: NfcReadingActiveEvent) => {
      snackBarRef = _snackBar.open('NFC reader ist aktiv', 'Stop');
      return snackBarRef.onAction().pipe(
        tap(() => {
          value.controller.abort("NFC reader stopped by user");
        })
      )
    }
      
    );

    // This is used to keep track of the current controller.
    const handleController = tap((val: NfcReadingActiveEvent) => {
      this.controller = val.controller;
    });

    // This is used to dismiss the snackbar if the NFC reader is inactive.
    const clearIfInactive = tap((val: NfcStatusEvent) => !val.active && snackBarRef?.dismiss());

    // We want to display a message when the NFC reader is active.
    this.scanningSubscription = nfc.isActive.valueChanges.pipe(
      clearIfInactive,
      filter(isReadingActiveEvent),
      handleController,
      displayMessage
    ).subscribe();

    // We want to redirect the user to the ringing page if the alarm is ringing.
    // and to the settings page if it's not.
    this.isRingingSubscription = dataBaseService.isRinging.subscribe(isRinging => {
      if (useDev) {
        return; // don't redirect in dev mode
      }
      router.navigate([isRinging ? 'ringing' : 'settings']); // redirect to the ringing page if the alarm is ringing
      // This simplifies navigation. No need for a nav-bar.
    });

    // Get current location
    const route = router.events.pipe(
      filter(event => 
        (event instanceof NavigationEnd) &&
        (router.url.endsWith('ringing') || router.url.endsWith('settings')) // Only change the title if we are on the ringing or settings page
      ), map(() => 
        router.url.charAt(1).toUpperCase() + router.url.slice(2) // Capitalize the first letter
      )
    );
    route.subscribe(url => titleService.setTitle(url));
    // We want to abort the NFC reader when we navigate to a different page.
    // This way we likely won't have to do it in the component itself.
    this.routerEventSubscription = router.events.subscribe(() => this.controller.abort());
  }
  
  ngOnDestroy() {
    [
      this.isRingingSubscription,
      this.scanningSubscription, 
      this.routerEventSubscription,
    ].forEach(sub => sub.unsubscribe());
    this.controller.abort();

    // Some cleanup. Probably not necessary.
  }
}
