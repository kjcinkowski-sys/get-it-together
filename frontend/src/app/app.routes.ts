import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'identities/new',
    loadComponent: () =>
      import('./features/identity-form/identity-form.component').then((m) => m.IdentityFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'identities/:identityId/habits/new',
    loadComponent: () => import('./features/habit-form/habit-form.component').then((m) => m.HabitFormComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
