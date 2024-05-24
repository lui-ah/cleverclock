import { Routes } from '@angular/router';
import { RingingComponent } from './ringing/ringing.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DebugComponent } from './debug/debug.component';
import { isNotRingingResolver, isRingingResolver, redirectRingingResolver } from './resolvers/is-ringing.resolver';
import { wakeOptionsResolver } from './resolvers/wakeOptions.resolver';
import { stateResolver } from './resolvers/state.resolver';
import { cardsResolver } from './resolvers/cards.resolver';

export const routes: Routes = [
    {
        path: 'settings',
        component: DashboardComponent,
        canActivate: [isNotRingingResolver], // 
        resolve: { // get the data before the component is created
            // This should avoid layout shifts and other issues.
            wakeOptions: wakeOptionsResolver, 
            state: stateResolver,
        },
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
        resolve: {
            cards: cardsResolver,
            wakeOptions: wakeOptionsResolver, 
        }
    },
];

export const routesDev = routes.map(route => (
    {
        ...route,
        canActivate: [],
        canDeactivate: [] 
    }
));