import { Routes } from '@angular/router';
import { RingingComponent } from './ringing/ringing.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DebugComponent } from './debug/debug.component';

export const routes: Routes = [
    {
        path: 'settings',
        component: DashboardComponent,
    },
    {
        path: '',
        component: DebugComponent,
    },
    {
        path: 'ringing',
        component: RingingComponent,
    },
];
