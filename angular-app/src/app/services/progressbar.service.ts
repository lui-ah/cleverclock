import { Injectable } from '@angular/core';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressbarService {

  active: boolean = false;
  value: number = 0;
  mode: ProgressBarMode = 'indeterminate';
  color: string = 'primary';
  

  constructor() { }
}
