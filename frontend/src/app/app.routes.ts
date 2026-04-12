import { Routes } from '@angular/router';
import { authGuard }  from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Auth layout routes (public)
  {
    path: 'auth',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Sign In — VaultFlow',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Create Account — VaultFlow',
      },
    ],
  },

  // App shell routes (protected)
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard — VaultFlow',
      },
      {
        path: 'wallet',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/wallet/wallet.component').then(m => m.WalletComponent),
            title: 'My Wallet — VaultFlow',
          },
          {
            path: 'deposit',
            loadComponent: () =>
              import('./features/wallet/deposit/deposit.component').then(m => m.DepositComponent),
            title: 'Deposit — VaultFlow',
          },
        ],
      },
      {
        path: 'transfer',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/transfer/send-money/send-money.component').then(m => m.SendMoneyComponent),
            title: 'Send Money — VaultFlow',
          },
          {
            path: 'confirm',
            loadComponent: () =>
              import('./features/transfer/confirm-transfer/confirm-transfer.component').then(m => m.ConfirmTransferComponent),
            title: 'Confirm Transfer — VaultFlow',
          },
        ],
      },
      {
        path: 'transactions',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/transactions/transaction-list/transaction-list.component').then(m => m.TransactionListComponent),
            title: 'Transactions — VaultFlow',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/transactions/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent),
            title: 'Transaction Detail — VaultFlow',
          },
        ],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile — VaultFlow',
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
            title: 'Admin Dashboard — VaultFlow',
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
            title: 'User Management — VaultFlow',
          },
        ],
      },
    ],
  },

  // 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 — VaultFlow',
  },
];
