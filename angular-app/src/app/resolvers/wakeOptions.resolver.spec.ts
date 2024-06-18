import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { wakeOptionsResolver } from './wakeOptions.resolver';
import { SwitchOption } from '@custom-types/types';

describe('wakeOptionsResolver', () => {
  const executeResolver: ResolveFn<SwitchOption<boolean>> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => wakeOptionsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
