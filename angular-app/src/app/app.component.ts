import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor() {
    try {
      // (screen.orientation as any).lock("portrait");
    } catch (error) { }

    if (false) { // TODO: Make this display if the user is not using a phone in portrait mode
      alert(""
        + "Die APP wurde im proof of Concept nur für Handies ausgelegt. \n"
        + "Ich hab mir keine Mühe gemacht, ein vernünftiges Layout für breite Bildschirme zu erstellen. \n"
        + "Bitte Benutze die dev tools um eine Handy auflösung zu simulieren, " 
        + "verkleinere das Fenster deines Browsers oder benutze ein Handy!"
      );
    }
  }
}
