import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from "@angular/material/divider";
import { map, timer } from 'rxjs';
import { items } from '../dashboard/anki-upload/mock-data'
import { Card } from '../types/types';

@Component({
    selector: 'app-ringing',
    standalone: true,
    imports: [
    DatePipe, MatInputModule, FormsModule, MatIconModule, MatButtonModule, MatDividerModule,
  ],
  templateUrl: './ringing.component.html',
  styleUrl: './ringing.component.scss'
})
export class RingingComponent {
  time: number;
  value: string = '';
  card: Card = items[Math.floor(Math.random() * items.length)];
  
  constructor() {
    this.time = Date.now();
  }
  
  async ngOnInit() {
    const time = timer(0, 500).pipe(map(() => Date.now()));
    time.subscribe((time) => this.time = time); 
  }
}
