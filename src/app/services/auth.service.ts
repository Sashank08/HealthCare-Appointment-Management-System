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
    
    return this.http.post(`${this.baseUrl}/login`, loginData, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      catchError(error => {
        console.error('Login error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });
        return throwError(() => error);
      })
    );
  }

  register(userData: any): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('Register request to:', `${this.baseUrl}/register`);
    console.log('Register data:', userData);
    
    return this.http.post(`${this.baseUrl}/register`, userData, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      catchError(error => {
        console.error('Registration error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });
        
        if (error.status === 0) {
          return throwError(() => new Error('Cannot connect to backend. Please check if the backend server is running on port 8081.'));
        } else if (error.status === 500) {
          return throwError(() => new Error('Server error. Please check backend logs.'));
        } else if (error.status === 400) {
          return throwError(() => new Error('Invalid registration data. Please check all fields.'));
        } else {
          return throwError(() => new Error(error.error || error.message || 'Registration failed'));
        }
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
      return payload.name || payload.fullName || payload.username || null;
    } catch (error) {
      console.error('Error extracting name from token:', error);
      return null;
    }
  }

  extractUserIdFromToken(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT payload for ID extraction:', payload);
      
      // Try to get numeric ID from various possible fields
      const id = payload.userId || payload.id || payload.user_id;
      
      // Convert to number if it's a string
      if (id !== null && id !== undefined) {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        return isNaN(numericId) ? null : numericId;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  }

  extractUserEmailFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userEmail || payload.email || payload.sub || null;
    } catch (error) {
      console.error('Error extracting user email from token:', error);
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

  removeToken(): void {
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

  getUserByPhone(phone: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<any>(`${this.baseUrl}/by-phone/${phone}`, { headers }).pipe(
      catchError(error => {
        console.error('Get user by phone error:', error);
        return throwError(() => error);
      })
    );
  }

  getUserByEmail(email: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<any>(`${this.baseUrl}/by-email/${email}`, { headers }).pipe(
      catchError(error => {
        console.error('Get user by email error:', error);
        return throwError(() => error);
      })
    );
  }
}