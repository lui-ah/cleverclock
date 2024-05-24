import { ResolveFn } from '@angular/router';
import { DatabaseService } from '../database.service';
import { inject } from '@angular/core';
import { SwitchOption } from '../types/types';

export const wakeOptionsResolver: ResolveFn<SwitchOption<boolean>> = (route, state) => {
  const databaseService = inject(DatabaseService);

  return databaseService.wakeOptions;
};
