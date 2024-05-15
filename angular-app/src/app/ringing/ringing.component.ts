import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from "@angular/material/divider";
import { Observable, Subscription, map, take, timer } from 'rxjs';
import { items } from '../dashboard/anki-upload/mock-data'
import { Card } from '../types/types';
import { DatabaseService } from '../database.service';
import { ActivatedRoute } from '@angular/router';

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
  
  constructor(private db : DatabaseService, private route: ActivatedRoute) {
    this.time = Date.now();

    const time = timer(0, 500).pipe(map(() => Date.now()));
    this.timeSubscribtion = time.subscribe((time) => this.time = time); 

    this.cards = route.data.pipe(map(data => data['cards'] as Card[]), take(1));
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
}
