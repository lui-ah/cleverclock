import { ResolveFn } from '@angular/router';
import { DatabaseService } from '@services/database.service';
import { inject } from '@angular/core';
import { SwitchOption } from '@custom-types/types';

export const wakeOptionsResolver: ResolveFn<SwitchOption<boolean>> = (route, state) => {
  const databaseService = inject(DatabaseService);

  return databaseService.wakeOptions;
};
