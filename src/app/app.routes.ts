import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/user-management', pathMatch: 'full' },
  { path: 'user-management', loadComponent: () => import('./user-management/user-management').then(m => m.UserManagementComponent) },
  { path: '**', redirectTo: '' }
];