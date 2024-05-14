import { Routes } from '@angular/router';
import { RingingComponent } from './ringing/ringing.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DebugComponent } from './debug/debug.component';
import { isNotRingingResolver, isRingingResolver, redirectRingingResolver } from './resolvers/is-ringing.resolver';

export const routes: Routes = [
    {
        path: 'settings',
        component: DashboardComponent,
        canActivate: [isNotRingingResolver],
    },
    {
        path: '',
        component: DebugComponent,
        canActivate: [redirectRingingResolver],

    },
    {
        path: 'ringing',
        component: RingingComponent,
        canActivate: [isRingingResolver],
        canDeactivate: [isNotRingingResolver],
    },
];
