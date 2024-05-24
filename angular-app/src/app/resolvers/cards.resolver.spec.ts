import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { cardsResolver } from './cards.resolver';
import { Card } from '../types/types';

describe('cardsResolver', () => {
  const executeResolver: ResolveFn<Card[]> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => cardsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
