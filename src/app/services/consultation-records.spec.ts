import { TestBed } from '@angular/core/testing';

import { ConsultationRecords } from './consultation-records';

describe('ConsultationRecords', () => {
  let service: ConsultationRecords;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsultationRecords);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
