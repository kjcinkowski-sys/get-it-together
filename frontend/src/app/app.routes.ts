import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    // Authenticated app: everything below renders inside the nav shell.
    path: '',
    loadComponent: () => import('./shared/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'stats',
        loadComponent: () => import('./features/stats/stats.component').then((m) => m.StatsComponent),
      },
      {
        path: 'identities/new',
        loadComponent: () =>
          import('./features/identity-form/identity-form.component').then((m) => m.IdentityFormComponent),
      },
      {
        path: 'identities/:identityId/habits/new',
        loadComponent: () =>
          import('./features/habit-form/habit-form.component').then((m) => m.HabitFormComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
