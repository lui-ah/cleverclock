import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DatabaseService } from './database.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isRingingSubscription: Subscription;
  
  constructor(dataBaseService: DatabaseService, router: Router) {
    this.isRingingSubscription = dataBaseService.isRinging.subscribe(e => {
      router.navigate([e ? 'ringing' : 'settings']);
    });
  }
  
  ngOnDestroy() {
    this.isRingingSubscription.unsubscribe();
  }
}
