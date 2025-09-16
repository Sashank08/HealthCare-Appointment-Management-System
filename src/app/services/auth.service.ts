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

  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }
}