import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/user-management', pathMatch: 'full' },
  { path: 'user-management', loadComponent: () => import('./user-management/user-management').then(m => m.UserManagementComponent) },
  { path: 'appointment-scheduling', loadComponent: () => import('./appointment-scheduling/appointment-scheduling').then(m => m.AppointmentScheduling) },
  { path: '**', redirectTo: '' }
];