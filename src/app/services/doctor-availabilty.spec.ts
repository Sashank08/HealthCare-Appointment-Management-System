import { TestBed } from '@angular/core/testing';

import { DoctorAvailabilty } from './doctor-availabilty';

describe('DoctorAvailabilty', () => {
  let service: DoctorAvailabilty;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DoctorAvailabilty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
