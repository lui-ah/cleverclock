import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { firebaseConfig } from "../environment/environment.prod";
import { provideVertexAI, getVertexAI } from '@angular/fire/vertexai-preview';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    // This was wrappen in importProvidersFrom
    // This was broken in 17.1.0 https://github.com/angular/angularfire/issues/3526
    // Rolling back to 17.0.1 would fix this, but we probably need the vertexAI wrapper later cause it's cheaper than OpenAI.
    provideFirebaseApp(() => 
      initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideVertexAI(() => getVertexAI()),
  ]
};
