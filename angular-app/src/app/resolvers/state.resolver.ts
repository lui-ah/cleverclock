import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DatabaseService } from '@services/database.service';
import { ClockState } from '@custom-types/types';

export const stateResolver: ResolveFn<ClockState> = (route, state) => {
  const databaseService = inject(DatabaseService);

  return databaseService.state;
};
