import { ResolveFn } from '@angular/router';
import { Card } from '../types/types';
import { inject } from '@angular/core';
import { DatabaseService } from '../database.service';

export const cardsResolver: ResolveFn<Card[]> = (route, state) => {
  const databaseService = inject(DatabaseService);

  return databaseService.cards;
};
