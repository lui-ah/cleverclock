import { KeyValuePipe, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SwitchOption, SwitchOptionPair } from '../../types/types';

@Component({
  selector: 'app-switches',
  standalone: true,
  imports: [
    MatSlideToggleModule,
    FormsModule,
    NgFor,
    KeyValuePipe,
  ],
  templateUrl: './switches.component.html',
  styleUrl: './switches.component.scss'
})
export class SwitchesComponent {
  // These all need to be resolved before this route is activated. 
  // Default is fine right now.
  options: SwitchOption<SwitchOptionPair> = {
    anki: { name: "Anki", value: true },
    nfc: { name: "NFC", value: true },
    quickOff: { name: "Quick Off", value: false },
  };

  updateSwitches(_event: any) {
    const options: SwitchOption<boolean> = {
      anki: this.options.anki.value,
      nfc: this.options.nfc.value,
      quickOff: this.options.quickOff.value,
    };
  }
}