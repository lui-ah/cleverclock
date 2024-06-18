import { AsyncPipe, CommonModule, KeyValuePipe, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SwitchOption, SwitchOptionKeys } from '@custom-types/types';
import { DatabaseService } from '@services/database.service';
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
    CommonModule,
  ],
  templateUrl: './switches.component.html',
  styleUrl: './switches.component.scss'
})
export class SwitchesComponent {
  options: Observable<SwitchOption<boolean>>;

  constructor(private db : DatabaseService, private route: ActivatedRoute) { 
    this.options = concat( // get the data from the resolver then let the db take over.
      this.route.data.pipe(map(data => data['wakeOptions']), take(1)),
      this.db.wakeOptions,
    );
  }

  updateSwitch(optionName: SwitchOptionKeys, value: boolean)  { 
    this.db.setWakeOption(optionName, value);
  }
}