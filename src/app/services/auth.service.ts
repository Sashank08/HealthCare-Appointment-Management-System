import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    const loginData = { userEmail: email, password: password };
    console.log('Login request:', loginData);
    
    return this.http.post(`${this.baseUrl}/login`, loginData, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error(error.error || 'Login failed'));
      })
    );
  }

  register(userData: any): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('Register request:', userData);
    
    return this.http.post(`${this.baseUrl}/register`, userData, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => new Error(error.error || 'Registration failed'));
      })
    );
  }

  extractRoleFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      return null;
    }
  }

  extractUserNameFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT payload:', payload);
      return payload.name || payload.fullName || payload.sub || payload.userEmail || null;
    } catch (error) {
      console.error('Error extracting name from token:', error);
      return null;
    }
  }

  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  checkUserExists(email: string): Observable<boolean> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.get<boolean>(`${this.baseUrl}/user-exists?email=${email}`, { headers }).pipe(
      catchError(error => {
        console.error('User check error:', error);
        return throwError(() => new Error('Unable to verify user'));
      })
    );
  }
}