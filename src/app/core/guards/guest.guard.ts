import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (!this.auth.isLoggedIn()) {
      return true;
    }
    const roles = this.auth.getUserRoles();
    if (!roles.includes('administrateur')) return this.router.parseUrl('/articles');
    return this.router.parseUrl('/dashboard');
  }
}
