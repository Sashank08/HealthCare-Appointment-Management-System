import { TestBed } from '@angular/core/testing';

import { AppointmentScheduling } from './appointment-scheduling';

describe('AppointmentScheduling', () => {
  let service: AppointmentScheduling;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentScheduling);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
