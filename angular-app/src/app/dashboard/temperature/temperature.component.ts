import { Component } from '@angular/core';
import { Chart, registerables } from "chart.js"; //TODO: optimize bundle size
import { data } from './mockdata';
import annotationPlugin from 'chartjs-plugin-annotation';

@Component({
  selector: 'app-temperature',
  standalone: true,
  imports: [],
  templateUrl: './temperature.component.html',
  styleUrl: './temperature.component.scss'
})
export class TemperatureComponent {

  ngOnInit() {
    Chart.register(...registerables);
    Chart.register(annotationPlugin);
    new Chart(document.getElementById('temperature') as HTMLCanvasElement,
      {
        type: 'line',
        data,
        options: {
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
      }
    )
  }
}
