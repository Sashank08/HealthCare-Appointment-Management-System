import { Routes } from '@angular/router';
import { DoctorAvailabilty } from './doctor-availability/doctor-availabilty';
import { ConsultationRecordsComponent } from './consultation-records/consultation-records';

export const routes: Routes = [
  { path: '', redirectTo: '/doctor-availability', pathMatch: 'full' },
  { path: 'doctor-availability', component: DoctorAvailabilty },
  { path: 'consultations', component: ConsultationRecordsComponent },
  { path: '**', redirectTo: '/doctor-availability' }
];
