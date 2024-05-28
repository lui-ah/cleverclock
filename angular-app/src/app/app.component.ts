import { Component , isDevMode } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { DatabaseService } from './database.service';
import { Subscription, filter, map } from 'rxjs';
import { globalConfig } from './app.config';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  isRingingSubscription: Subscription;
  
  constructor(dataBaseService: DatabaseService, router: Router, titleService: Title) {
    this.isRingingSubscription = dataBaseService.isRinging.subscribe(isRinging => {
      if (isDevMode() || globalConfig.forceDebug) {
        return; // don't redirect in dev mode
      }
      router.navigate([isRinging ? 'ringing' : 'settings']); // redirect to the ringing page if the alarm is ringing
      // This simplifies navigation. No need for a nav-bar.
    });

    // Get current location
    const route = router.events.pipe(
      filter(event => 
        (event instanceof NavigationEnd) &&
        (router.url.endsWith('ringing') || router.url.endsWith('settings')) // Only change the title if we are on the ringing or settings page
      ), map(() => 
        router.url.charAt(1).toUpperCase() + router.url.slice(2) // Capitalize the first letter
      )
    );
    route.subscribe(url => titleService.setTitle(url));
  }
  
  ngOnDestroy() {
    this.isRingingSubscription.unsubscribe(); // prevent memory leaks
    // Usually we don't explicitly subscribe to obersables, but this time we have to.
  }
}
