import { ComponentFixture, TestBed } from '@angular/core/testing';
 
import { DoctorAvailabilty } from './doctor-availabilty';
 
describe('DoctorAvailabilty', () => {
  let component: DoctorAvailabilty;
  let fixture: ComponentFixture<DoctorAvailabilty>;
 
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorAvailabilty]
    })
    .compileComponents();
 
    fixture = TestBed.createComponent(DoctorAvailabilty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
 
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
 