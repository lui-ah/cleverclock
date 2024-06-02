import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NfcService } from '../../nfc.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nfc',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './nfc.component.html',
  styleUrl: './nfc.component.scss'
})
export class NfcComponent {
  constructor(public nfc: NfcService) { }

  writeNfc() {
    this.nfc.writeCode().subscribe();
  }
}
