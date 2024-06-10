import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { stateResolver } from './state.resolver';
import { ClockState } from '@custom-types/types';

describe('stateResolver', () => {
  const executeResolver: ResolveFn<ClockState> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => stateResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
