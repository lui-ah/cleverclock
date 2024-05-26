import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from "@angular/material/divider";
import { Observable, Subscription, map, take, timer } from 'rxjs';
import { DatabaseService } from '../database.service';
import { ActivatedRoute } from '@angular/router';
import { Card, Feedback, SwitchOption } from '../types/types';
import { DialogModule } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import confetti from 'canvas-confetti'; // Import the confetti library, most web-dev thing I've ever done.
import { SmartRatingService } from '../smart-rating.service';
import {MatSnackBar } from '@angular/material/snack-bar';
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
  value: string = '';
  makingRequest: boolean = false;
  card: Card | undefined;

  cards: Observable<Card[]>;
  display: Observable<SwitchOption<boolean>>;

  timeSubscribtion: Subscription;

  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute, 
    private db: DatabaseService,
    private ai: SmartRatingService,
    private _snackBar: MatSnackBar
  ) {
    this.time = Date.now();

    const time = timer(0, 500).pipe(map(() => Date.now()));
    this.timeSubscribtion = time.subscribe((time) => this.time = time); 

    this.display = this.route.data.pipe(map(data => data['wakeOptions'] as SwitchOption<boolean>), take(1));

    this.cards = this.route.data.pipe(map(data => data['cards'] as Card[]), take(1));
    // Getting the data once is enough. We don't want to indtroduce too much overhead.
    // There won't be any changes to the cards while the user is on this page anyway.
    this.cards.subscribe(cards => { // We only take one value, so no need to unsubscribe.
      this.card = cards[Math.floor(Math.random() * cards.length)];
    });
    // As long as we don't plan to implement that feature, where we require multiple correct answers, 
    // we can just pick a random card from the list.
    // if we decide to implement that feature, additonal logic (and UI) will be required.
  }
  
  async skipTask(id?: number) {
    // We will pick a random card from the list, but exclude the card that was skipped.
    // id might be undefined, if the user skips the task without selecting an answer.
    // but that's fine, because undefined is always not equal to card.id anyway.
    this.cards.subscribe(cards => {
      const filteredCards = cards.filter(card => card.id !== id);
      this.card = filteredCards[Math.floor(Math.random() * filteredCards.length)];
    });
  }

  async determineSuccess() {
    if(!this.card) return; // This should never happen, but better safe than sorry.
    
    this.openSnackBar('Wir denken sehr scharf nach...', 'Ok', 1500); // The request is hella fast, but it's nice to have a loading indicator.
    this.makingRequest = true;
    const response = await this.ai.getRating(this.value, this.card);
    this.makingRequest = false;

    this.value = ''; // Clear the input field.

    response.accept ? this.displaySuccessTask(response) : this.displayFailureTask(response);
  }

  stopRinging() {
    this.db.setRinging(false);
  }

  scanNFC() {
    // TODO: Implement NFC scanning.
    // this.stopRinging();
  }

  async displaySuccessTask(feedback: Feedback) {

    // Consider fading out the background.
    const dialogRef = this.dialog.open(SuccessDialog,
      {
        data: { card: this.card, feedback, },
        width: '400px', // Same width as the main content.
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      this.stopRinging();
    });
  }

  async displayFailureTask(feedback: Feedback) {
    // Consider fading out the background.
    const dialogRef = this.dialog.open(FailureDialog,
      {
        data: { card: this.card, feedback, },
        width: '400px', // Same width as the main content.
      }
    );

    dialogRef.afterClosed().subscribe(() => {
      if (!this.card) return; // This should never happen, but better safe than sorry.
      this.skipTask(this.card.id);
    });
  }

  openSnackBar(message: string, action: string, duration: number = 2000) {
    this._snackBar.open(message, action, {
      duration,
    });
  }

  ngOnDestroy() {
    this.timeSubscribtion.unsubscribe();
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
  card: Card;

  feedback: Feedback;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {card: Card, feedback: Feedback}) {
    this.card = data.card;
    this.feedback = data.feedback;

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
  feedback: Feedback;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {card: Card, feedback: Feedback}) {
    this.feedback = data.feedback;
    this.card = data.card;
  }
}