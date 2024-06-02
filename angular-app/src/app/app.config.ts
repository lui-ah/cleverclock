import { ApplicationConfig } from '@angular/core';
import { Route, Routes, provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { connectFunctionsEmulator, getFunctions, provideFunctions } from '@angular/fire/functions';
import { firebaseConfig } from "../environment/environment.prod";
import { isDevMode } from '@angular/core';
import { getVertexAI, provideVertexAI } from '@angular/fire/vertexai-preview';

export const functionsForceProduction = false;
export const forceDebug = true;
export const useDev = (isDevMode() || forceDebug);

const removeGuards = (routes: Routes) => routes.map((route) => (
  {
    ...route,
    canActivate: [],
    canDeactivate: [],
  }
));


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(useDev ? removeGuards(routes) : routes),
    provideAnimations(),
    // This was wrappen in importProvidersFrom
    // This was broken in 17.1.0 https://github.com/angular/angularfire/issues/3526
    // Rolling back to 17.0.1 would fix this, but we probably need the vertexAI wrapper later cause it's cheaper than OpenAI.
    provideFirebaseApp(() =>
      initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideVertexAI(() => getVertexAI()),
    provideFunctions(() => {
      const functions = getFunctions()
      if (isDevMode() && !functionsForceProduction) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions
    })
  ]
};
