import { Routes } from '@angular/router';
import { RingingComponent } from './ringing/ringing.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'ringing', // for this initial demo this needs to redirect.
        pathMatch: "full"
    },
    {
        path: 'ringing',
        component: RingingComponent,
    },
];
