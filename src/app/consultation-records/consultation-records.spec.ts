import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationRecords } from './consultation-records';

describe('ConsultationRecords', () => {
  let component: ConsultationRecords;
  let fixture: ComponentFixture<ConsultationRecords>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultationRecords]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultationRecords);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
