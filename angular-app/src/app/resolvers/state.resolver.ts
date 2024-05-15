import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DatabaseService } from '../database.service';
import { ClockState } from '../types/types';

export const stateResolver: ResolveFn<ClockState> = (route, state) => {
  const databaseService = inject(DatabaseService);

  return databaseService.state;
};
