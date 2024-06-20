import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { sensorResolver } from './sensor.resolver';
import { SensorData } from '../types/types';

describe('sensorResolver', () => {
  const executeResolver: ResolveFn<SensorData> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => sensorResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
