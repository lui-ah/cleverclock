import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DatabaseService } from '@services/database.service';
import { SensorData } from '../types/types';

export const sensorResolver: ResolveFn<SensorData> = () => {
  const databaseService = inject(DatabaseService);

  return databaseService.sensorData;
};
