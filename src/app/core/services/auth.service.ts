import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8081/auth';
  private tokenKey = 'token';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    // Save roles in localStorage
    const decoded: any = this.decodeToken(token);
    let roles: string[] = [];
    if (decoded) {
      if (decoded.role && Array.isArray(decoded.role)) {
        roles = decoded.role.map((r: any) => r.role);
      } else if (decoded.claims && Array.isArray(decoded.claims.role)) {
        roles = decoded.claims.role.map((r: any) => r.role);
      }
    }
    localStorage.setItem('roles', JSON.stringify(roles));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const decoded: any = this.decodeToken(token);
    if (!decoded) return false;
    if (decoded.exp && typeof decoded.exp === 'string') {
      return Date.now() < new Date(decoded.exp).getTime();
    }
    if (decoded.exp && typeof decoded.exp === 'number') {
      return Date.now() < decoded.exp * 1000;
    }
    return true;
  }

  getRolesFromStorage(): string[] {
    const roles = localStorage.getItem('roles');
    if (roles) {
      try {
        return JSON.parse(roles);
      } catch {
        return [];
      }
    }
    return [];
  }

  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    // Prefer roles from localStorage
    const storedRoles = this.getRolesFromStorage();
    if (storedRoles.length > 0) return storedRoles;
    // Fallback to decoding
    const decoded: any = this.decodeToken(token);
    if (!decoded) return [];
    if (decoded.role && Array.isArray(decoded.role)) {
      return decoded.role.map((r: any) => r.role);
    }
    if (decoded.claims && Array.isArray(decoded.claims.role)) {
      return decoded.claims.role.map((r: any) => r.role);
    }
    return [];
  }
} 