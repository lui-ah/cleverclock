import { DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { NgxMaterialTimepickerComponent, NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    DatePipe, 
    NgxMaterialTimepickerModule, 
    MatInputModule,
    MatButtonModule,
    FormsModule,
  ],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss'
})
export class DatePickerComponent {
  currentTime: number;
  @ViewChild('picker') picker!: NgxMaterialTimepickerComponent;
  inputVal: string = '';
  
  isToday(time: number): boolean {
    const currentDate = new Date();
    const targetDate = new Date(time);
    return currentDate.getDay() == targetDate.getDay();
  }

  constructor() {
    this.currentTime = Date.now();
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

    this.currentTime = targetDate.getTime();
  }

}
