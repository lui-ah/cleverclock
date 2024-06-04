import { Routes } from '@angular/router';
import { isNotRingingResolver, isRingingResolver, redirectRingingResolver } from './resolvers/is-ringing.resolver';
import { wakeOptionsResolver } from './resolvers/wakeOptions.resolver';
import { stateResolver } from './resolvers/state.resolver';
import { cardsResolver } from './resolvers/cards.resolver';

export const routes: Routes = [
    {
        path: 'settings',
        loadComponent: () =>
            import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [isNotRingingResolver],
        resolve: {
            wakeOptions: wakeOptionsResolver,
            state: stateResolver,
        },
    },
    {
        path: '',
        loadComponent: () =>
            import('./debug/debug.component').then((m) => m.DebugComponent),
        canActivate: [redirectRingingResolver],
    },
    {
        path: 'ringing',
        loadComponent: () =>
            import('./ringing/ringing.component').then((m) => m.RingingComponent),
        canActivate: [isRingingResolver],
        canDeactivate: [isNotRingingResolver],
        resolve: {
            cards: cardsResolver,
            wakeOptions: wakeOptionsResolver,
        },
    },
];