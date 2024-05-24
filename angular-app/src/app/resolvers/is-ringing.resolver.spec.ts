import { TestBed } from '@angular/core/testing';
import { ResolveFn, UrlTree } from '@angular/router';

import { isRingingResolver } from './is-ringing.resolver';

describe('isRingingResolver', () => {
  const executeResolver: ResolveFn<boolean | UrlTree> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => isRingingResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
