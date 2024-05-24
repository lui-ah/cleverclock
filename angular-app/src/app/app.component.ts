import { Component, isDevMode } from '@angular/core';
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
    this.isRingingSubscription = dataBaseService.isRinging.subscribe(isRinging => {
      if (isDevMode()) {
        return; // don't redirect in dev mode
      }
      router.navigate([isRinging ? 'ringing' : 'settings']); // redirect to the ringing page if the alarm is ringing
      // This simplifies navigation. No need for a nav-bar.
    });
  }
  
  ngOnDestroy() {
    this.isRingingSubscription.unsubscribe(); // prevent memory leaks
    // Usually we don't explicitly subscribe to obersables, but this time we have to.
  }
}
