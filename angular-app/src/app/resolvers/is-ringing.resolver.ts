import { ResolveFn, Router, UrlTree } from '@angular/router';
import { DatabaseService } from '../database.service';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

const isRingingHelper: () => Observable<boolean> = () => {
  const databaseService = inject(DatabaseService);
  
  return databaseService.isRinging;
}

export const isRingingResolver: ResolveFn<boolean | UrlTree> = (route, state) => {
  const router = inject(Router);
  
  return isRingingHelper()
  .pipe(
    map(
      isRigning => isRigning ? true : 
      router.createUrlTree(['settings'])
    )
  );
};

export const isNotRingingResolver: ResolveFn<boolean | UrlTree> = (route, state) => {
  const router = inject(Router);
  
  return isRingingHelper()
  .pipe(
    map(
      isNotRinging => !isNotRinging ? true : 
      router.createUrlTree(['ringing'])
    )
  );
};

export const redirectRingingResolver: ResolveFn<UrlTree> = (route, state) => {
  const router = inject(Router);
  
  return isRingingHelper().pipe(
    map(isRinging => isRinging ? 'ringing' : 'settings'),
    map(path => router.createUrlTree([path]))
  );
  
};
