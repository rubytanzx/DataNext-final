import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly CREDS = { id: 'test', password: 'test123' };
  private readonly SESSION_KEY = 'dn_authed';

  isAuthenticated = signal(this.hasSession());

  constructor(private router: Router) {}

  login(id: string, password: string): boolean {
    if (id === this.CREDS.id && password === this.CREDS.password) {
      sessionStorage.setItem(this.SESSION_KEY, '1');
      this.isAuthenticated.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    this.isAuthenticated.set(false);
    this.router.navigate(['/']);
  }

  private hasSession(): boolean {
    return sessionStorage.getItem(this.SESSION_KEY) === '1';
  }
}
