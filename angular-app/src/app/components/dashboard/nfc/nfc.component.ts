import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NfcService } from '@services/nfc.service';
import { Subscription, delay } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-nfc',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './nfc.component.html',
  styleUrl: './nfc.component.scss'
})
export class NfcComponent {
  constructor(public nfc: NfcService, private _snackBar: MatSnackBar) { }

  writeNfc() {
    this.nfc.writeCode().subscribe(() => {
      this._snackBar.open('NFC Tag beschrieben', 'OK' , { duration: 2000 })
    });
  }
}
