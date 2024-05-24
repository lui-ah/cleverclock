import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { NgxMaterialTimepickerComponent, NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, concat, map, take } from 'rxjs';
import { DatabaseService } from '../../database.service';
import { ClockState } from '../../types/types';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    DatePipe, 
    NgxMaterialTimepickerModule, 
    MatInputModule,
    MatButtonModule,
    FormsModule,
    AsyncPipe,
    CommonModule,
  ],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss'
})
export class DatePickerComponent {
  currentTime: Observable<number>;
  @ViewChild('picker') picker!: NgxMaterialTimepickerComponent;
  inputVal: string = '';
  
  isToday(time: number): boolean {
    const currentDate = new Date();
    const targetDate = new Date(time);
    return currentDate.getDay() == targetDate.getDay();
  }

  constructor(private db : DatabaseService, private route: ActivatedRoute) { 
    this.currentTime = concat( // get the data from the resolver then let the db take over.
      this.route.data.pipe(map(data => (data['state'] as ClockState).nextTimer), take(1)),
      this.db.nextTimer,
    ).pipe(map(ts => ts.toDate().getTime()));
  }

  setTime() {
    const value = this.picker.time;
    // format: "8:25 AM"

    this.inputVal = '';
    const [hours, minutes, period] = value.split(/:| /);
    const currentDate = new Date();
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      period === 'AM' ? parseInt(hours) : parseInt(hours) + 12,
      parseInt(minutes)
    );

    if (targetDate < currentDate) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    this.db.setNextTimer(targetDate);
  }

}
