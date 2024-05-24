import { ChartData } from "chart.js";

const labels = [
    "12:00", "12:15", "12:30", "12:45", "1:00", "1:15", "1:30", "1:45", "2:00", "2:15", "2:30", "2:45", "3:00", "3:15", "3:30", "3:45", "4:00", "4:15", "4:30", "4:45", "5:00", "5:15", "5:30", "5:45", "6:00", "6:15", "6:30", "6:45", "7:00", "7:15", "7:30", "7:45", "8:00", 
];
const points = [
    14, 13, 14, 14, 13, 13, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 18, 18, 19, 20, 21, 21, 22, 20, 21, 21, 22, 23, 23, 22, 22, 23, 24, 
];

export const data: ChartData = {
    labels: labels.filter((_val, index) => index % 2 == 0),
    datasets: [{
        label: '',
        data: points.filter((val, index) => index % 2 == 0),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0,
        pointBorderColor: 'rgb(0, 0, 0, 0)',
        // pointBackgroundColor: 'rgb(0, 0, 0, 0)',
        // If you don't want to show the points, uncomment the above line.
    }],
    
};

