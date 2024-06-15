import { Component } from '@angular/core';
import { DatePickerComponent } from "./date-picker/date-picker.component";
import { SwitchesComponent } from "./switches/switches.component";
import { AnkiUploadComponent } from '@components/dashboard/anki-upload/anki-upload.component';
import { NfcComponent } from '@components/dashboard/nfc/nfc.component';
import { ChartComponent, generateHalfHourTimes } from '@components/dashboard/chart/chart.component';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from '@src/app/services/database.service';
import { SensorData } from '@src/app/types/types';
import { ChartData, ChartConfiguration } from 'chart.js';
import { Observable, concat, map, take, skip, firstValueFrom, skipWhile } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    imports: [DatePickerComponent, SwitchesComponent, AnkiUploadComponent, NfcComponent, ChartComponent]
})
export class DashboardComponent {
    sensorData: Observable<SensorData>; 

  _titleTemperature: string = 'Temperatur';
  _dataTemperature: Observable<ChartData> | undefined; // This overwrites the data inside the chart.
  _chartTemperature: ChartConfiguration | undefined;

  _titleHumid: string = 'Luftfeuchtigkeit';
  _dataHumid: Observable<ChartData> | undefined; // This overwrites the data inside the chart.
  _chartHumid: ChartConfiguration | undefined;

  constructor(private route: ActivatedRoute, private db : DatabaseService) { 
    this.sensorData = concat(
      this.route.data.pipe(map(data => data['sensorDataExtended'] as SensorData), take(1)),
      this.db.sensorDataExtended.pipe(skip(1)),
    );
  }

  generateData = (data: number[]): ChartData => {
    let labels = generateHalfHourTimes(0, data.length / 2);

    // These arrays are both length 48 * 2 = 96
    // We are interested in the values from 20:00 to 08:00

    const start = 48 - 8;
    const end = 48 + 16;

    data = data.slice(start, end);
    labels = labels.slice(start, end);

    return {
      labels,
      datasets: [{
        label: 'Temperatur',
        data,
        // light black
        borderColor: 'rgba(80, 80, 80)',
        backgroundColor: 'rgba(80, 80, 80)',
        fill: false,
        borderWidth: 2,
        tension: 0.4,
        pointBorderColor: 'rgb(0, 0, 0, 0)',
        pointBackgroundColor: 'transparent',
      }],
    };
  }

  async ngOnInit() {
    const points = await firstValueFrom(this.sensorData);
    
    this._chartTemperature = {
      type: 'line',
      data: this.generateData(points.temperature),
      options: {
        animation: {
          duration: 0
        },
        plugins: {
          legend: {
            display: false,
          },
          annotation: {
            annotations: {
              good: {
                type: 'box',
                xMin: 0,
                yMin: 18,
                yMax: 22,
                borderColor: 'rgb(0, 0, 0, 0)',
                // Light green background.
                backgroundColor: 'rgba(144, 238, 144, 0.2)',
              },
              tooCold: {
                type: 'box',
                xMin: 0,
                yMax: 18,
                borderColor: 'rgb(0, 0, 0, 0)',
                // Light blue background.
                backgroundColor: 'rgba(173, 216, 230, 0.2)',
              },
              tooHot: {
                type: 'box',
                xMin: 0,
                yMin: 22,
                borderColor: 'rgb(0, 0, 0, 0)',
                // Light red background.
                backgroundColor: 'rgba(255, 182, 193, 0.2)',
              }
            }
          }            
        }
      }
    };
    this._chartHumid = {
        type: 'line',
        data: this.generateData(points.humidity),
        options: {
          animation: {
            duration: 0
          },
          plugins: {
            legend: {
              display: false,
            },
            annotation: {
              annotations: {
                good: {
                  type: 'box',
                  xMin: 0,
                  yMin: 40,
                  yMax: 60,
                  borderColor: 'rgb(0, 0, 0, 0)',
                  // Light green background.
                  backgroundColor: 'rgba(144, 238, 144, 0.2)',
                },
                tooCold: {
                  type: 'box',
                  xMin: 0,
                  yMax: 40,
                  borderColor: 'rgb(0, 0, 0, 0)',
                  // Light blue background.
                  backgroundColor: 'rgba(173, 216, 230, 0.2)',
                },
                tooHot: {
                  type: 'box',
                  xMin: 0,
                  yMin: 60,
                  borderColor: 'rgb(0, 0, 0, 0)',
                  // Light red background.
                  backgroundColor: 'rgba(255, 182, 193, 0.2)',
                }
              }
            }            
          }
        }
    };

    const block = skipWhile((data: SensorData, index) => data == points && index == 0);
    this._dataTemperature = this.sensorData.pipe(block, map(data => this.generateData(data.temperature)));
    this._dataHumid = this.sensorData.pipe(block, map(data => this.generateData(data.humidity)));
  }
}