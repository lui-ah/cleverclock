import { DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from "@angular/material/divider";
import { map, timer } from 'rxjs';
import { items } from '../dashboard/anki-upload/mock-data'
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
      DialogModule,
  ],
  templateUrl: './ringing.component.html',
  styleUrl: './ringing.component.scss'
})
export class RingingComponent {
  time: number;
  value: string = '';
  card: Card = items[Math.floor(Math.random() * items.length)];
  
  display: SwitchOption<boolean> = { // TODO: get this from the database.
    anki: true,
    nfc: true,
    quickOff: false,
  };

  constructor(public dialog: MatDialog) {
    this.time = Date.now();
  }
  
  ngOnInit() {
    const time = timer(0, 500).pipe(map(() => Date.now()));
    time.subscribe((time) => this.time = time); 
  }

  displaySuccessTask() {
    // Consider fading out the background.
    const dialogRef = this.dialog.open(DialogContentExampleDialog,
      {
        data: { card: this.card },
        width: '400px', // Same width as the main content.
      }
    );

    dialogRef.afterClosed().subscribe(_result => {
      // Stop the ringing.
    });
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
export class DialogContentExampleDialog {
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