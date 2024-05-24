import { TestBed } from '@angular/core/testing';

import { SmartRatingService } from './smart-rating.service';

describe('SmartRatingService', () => {
  let service: SmartRatingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmartRatingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
