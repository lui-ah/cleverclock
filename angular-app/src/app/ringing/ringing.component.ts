import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from "@angular/material/divider";
import { Observable, Subscription, firstValueFrom, map, take, timer } from 'rxjs';
import { DatabaseService } from '../database.service';
import { ActivatedRoute } from '@angular/router';
import { Card, SwitchOption } from '../types/types';
import { DialogModule } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import confetti from 'canvas-confetti'; // Import the confetti library, most web-dev thing I've ever done.

@Component({
    selector: 'app-ringing',
    standalone: true,
    imports: [
      DatePipe,
      MatInputModule,
      FormsModule,
      MatIconModule,
      MatButtonModule,
      MatDividerModule,
      AsyncPipe,
      CommonModule,
      DialogModule,
  ],
  templateUrl: './ringing.component.html',
  styleUrl: './ringing.component.scss'
})
export class RingingComponent {
  time: number;
  timeSubscribtion: Subscription;

  value: string = '';
  card: Observable<Card>;
  cards: Observable<Card[]>;
  
  display: Observable<SwitchOption<boolean>>;

  constructor(public dialog: MatDialog, private route: ActivatedRoute, private db: DatabaseService) {
    this.time = Date.now();

    const time = timer(0, 500).pipe(map(() => Date.now()));
    this.timeSubscribtion = time.subscribe((time) => this.time = time); 

    this.display = this.route.data.pipe(map(data => data['wakeOptions'] as SwitchOption<boolean>), take(1));

    this.cards = this.route.data.pipe(map(data => data['cards'] as Card[]), take(1));
    // Getting the data once is enough. We don't want to indtroduce too much overhead.
    // There won't be any changes to the cards while the user is on this page anyway.
    this.card = this.cards.pipe(map(cards => cards[Math.floor(Math.random() * cards.length)]));
    // As long as we don't plan to implement that feature, where we require multiple correct answers, 
    // we can just pick a random card from the list.
    // if we decide to implement that feature, additonal logic (and UI) will be required.
  }
  
  skipTask(id?: number) {
    // We will pick a random card from the list, but exclude the card that was skipped.
    // id might be undefined, if the user skips the task without selecting an answer.
    // but that's fine, because undefined is always not equal to card.id anyway.
    this.card = this.cards.pipe(
      map(cards => {
        const filtered = cards.filter(card => card.id !== id);
        return filtered[Math.floor(Math.random() * filtered.length)]
      })
    );
  }

  ngOnDestroy() {
    this.timeSubscribtion.unsubscribe();
  }

  determineSuccess() {
    // TODO: Implement the logic for determining success. Using this.value and this.card.
    Math.random() > 0.5 ? this.displaySuccessTask() : this.displayFailureTask();
  }

  async displaySuccessTask() {

    const card = await firstValueFrom(this.card);

    // Consider fading out the background.
    const dialogRef = this.dialog.open(SuccessDialog,
      {
        data: { card: card },
        width: '400px', // Same width as the main content.
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      // DEBUG: realistically, there shouldn't be a check here.
      if (result) this.stopRinging();
    });
  }

  async displayFailureTask() {
    const card = await firstValueFrom(this.card);

    // Consider fading out the background.
    const dialogRef = this.dialog.open(FailureDialog,
      {
        data: { card: card },
        width: '400px', // Same width as the main content.
      }
    );

    dialogRef.afterClosed().subscribe(_result => {
      this.skipTask(card.id);
      // TODO: Implement the logic for the failure dialog.
    });
  }

  stopRinging() {
    this.db.setRinging(false);
  }

  scanNFC() {
    // TODO: Implement NFC scanning.
    this.stopRinging();
  }
}

@Component({
  selector: 'success-dialog',
  templateUrl: 'success-dialog.html',
  styleUrl: './ringing.component.scss',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
  ],
})
export class SuccessDialog {
  interval: any;
  repeatEffect: boolean = false;
  card: Card;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {card: Card}) {
    this.card = data.card;

    // Has to be called in the constructor.
    // Somehow the canvas-confetti library doesn't work right if it's called in ngOnInit.
    // I don't care enough to figure out why.

    const myCanvas = document.getElementById('confetti') as HTMLCanvasElement;
    const myConfetti = confetti.create(myCanvas, {
      resize: true,
      useWorker: true
    });

    // Wait for the dialog opacity to be set to 1.
    setTimeout(() => {
      myConfetti({ // Might need some tweaking.
        particleCount: 180,
        startVelocity: 38,
        spread: 100,
        scalar: 1.2,
        zIndex: 1001, // Make sure it's on top of the dialog, which is 1000.
      }); 
    }, 80);
    
    // remind the user that they did a good job :)
    this.interval = this.repeatEffect ? setInterval(() => {
      myConfetti({
        particleCount: 80,
        startVelocity: 30,
        spread: 90,
        scalar: 1.2,
        zIndex: 1001,
      }); 
    }, 2500) : null;
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }
}

@Component({
  selector: 'failure-dialog',
  templateUrl: 'failure-dialog.html',
  styleUrl: './ringing.component.scss',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
  ],
})
export class FailureDialog {
  card: Card;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {card: Card}) {
    this.card = data.card;
  }
}