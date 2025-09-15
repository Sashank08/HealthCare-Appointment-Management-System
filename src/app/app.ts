import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsultationRecordsComponent } from './consultation-records/consultation-records';
import { DoctorAvailabilty } from './doctor-availabilty/doctor-availabilty';
import { provideHttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConsultationRecordsComponent],
  imports: [RouterOutlet, DoctorAvailabilty],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('HealthCare Appointment Management System');
}
