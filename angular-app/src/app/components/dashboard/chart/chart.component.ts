import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, registerables } from "chart.js"; //TODO: optimize bundle size
import annotationPlugin from 'chartjs-plugin-annotation';
import { Observable } from 'rxjs';

export function generateHalfHourTimes(start: number, end: number): string[] {
  const times: string[] = [];
  const padZero = (num: number): string => num < 10 ? '0' + num : num.toString();

  for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
          const time = `${padZero(hour % 24)}:${padZero(minute % 60)}`;
          times.push(time);
      }
  }

  return times;
}


@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent {

  @Input() title: string = 'Chart';
  @Input() data?: Observable<ChartData>; // This overwrites the data inside the chart.
  @Input() chart!: ChartConfiguration;
  @ViewChild('chartCanvas', {static: true}) chartCanvas!: ElementRef<HTMLCanvasElement>;

  async ngOnInit() {
    if (!this.chart || !this.chartCanvas) {
      throw new Error('Missing input data for chart component');
    }
    Chart.register(...registerables);
    Chart.register(annotationPlugin);

    const chart = new Chart(this.chartCanvas.nativeElement, this.chart);

    if (this.data) {
      this.data.subscribe(data => {
        chart.data = data;
        chart.update();
      });
    }
  }
}
