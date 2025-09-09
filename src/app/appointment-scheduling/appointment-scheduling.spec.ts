import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentScheduling } from './appointment-scheduling';

describe('AppointmentScheduling', () => {
  let component: AppointmentScheduling;
  let fixture: ComponentFixture<AppointmentScheduling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentScheduling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentScheduling);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
