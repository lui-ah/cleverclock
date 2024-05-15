import { AsyncPipe, KeyValuePipe, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SwitchOption, SwitchOptionKeys, SwitchOptionPair } from '../../types/types';
import { DatabaseService } from '../../database.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, concat, firstValueFrom, map, mergeMap, take } from 'rxjs';

@Component({
  selector: 'app-switches',
  standalone: true,
  imports: [
    MatSlideToggleModule,
    FormsModule,
    NgFor,
    KeyValuePipe,
    AsyncPipe,
  ],
  templateUrl: './switches.component.html',
  styleUrl: './switches.component.scss'
})
export class SwitchesComponent {
  options: Observable<SwitchOption<SwitchOptionPair>>;

  constructor(private db : DatabaseService, private route: ActivatedRoute) { 
    this.options = concat( // get the data from the resolver then let the db take over.
      this.route.data.pipe(map(data => data['wakeOptions']), take(1)),
      this.db.wakeOptions,
    ).pipe(
      map(data => { // convert the data to a format that the template can use
        const { anki, nfc, quickOff } = data;
        return { // TODO: refractor this to a helper function
          anki: { name: "Anki", value: anki },
          nfc: { name: "NFC", value: nfc },
          quickOff: { name: "Quick Off", value: quickOff },
        };
      })
    );
  }

  updateSwitch(optionName: SwitchOptionKeys, value: boolean)  { 
    this.db.setWakeOption(optionName, value);
  }
}