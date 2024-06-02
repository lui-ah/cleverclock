import { Component } from '@angular/core';
import { DatePickerComponent } from "./date-picker/date-picker.component";
import { SwitchesComponent } from "./switches/switches.component";
import { TemperatureComponent } from "./temperature/temperature.component";
import { AnkiUploadComponent } from "./anki-upload/anki-upload.component";
import { NfcComponent } from './nfc/nfc.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    imports: [DatePickerComponent, SwitchesComponent, TemperatureComponent, AnkiUploadComponent, NfcComponent]
})
export class DashboardComponent {
}