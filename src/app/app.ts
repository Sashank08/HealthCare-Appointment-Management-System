import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsultationRecordsComponent } from './consultation-records/consultation-records';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConsultationRecordsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('HealthCare_Appointment_Management_System');
}
