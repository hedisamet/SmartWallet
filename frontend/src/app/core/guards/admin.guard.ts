import { inject }        from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }   from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }

  // Non-admin users redirected to dashboard
  return router.createUrlTree(['/dashboard']);
};
