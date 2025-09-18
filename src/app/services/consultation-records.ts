import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Consultation {
  consultationId?: number;
  notes: string;
  prescription: string;
  appointmentId: number;
  patientId: number;
}

export interface ExceptionResponse {
  timestamp: string;
  message: string;
  details: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationRecordsService {
  private http = inject(HttpClient);
  
  private readonly baseUrl = 'http://localhost:8081/consult';
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private submittingSubject = new BehaviorSubject<boolean>(false);
  
  public loading$ = this.loadingSubject.asObservable();
  public submitting$ = this.submittingSubject.asObservable();
  
  private consultationsCache = new Map<number, Consultation[]>();

  private getTokenFromStorage(): string {
    const token = localStorage.getItem('authToken');
    return token ? `Bearer ${token}` : '';
  }

  private getAuthHeaders(): HttpHeaders {
    const authToken = this.getTokenFromStorage();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': authToken,
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
  }

  private getAuthHeadersForText(): HttpHeaders {
    const authToken = this.getTokenFromStorage();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': authToken,
      'Accept': 'text/plain'
    });
  }

  saveConsultation(consultation: Consultation): Observable<string> {
    this.submittingSubject.next(true);
    
    const options = {
      headers: this.getAuthHeadersForText(),
      responseType: 'text' as 'json'
    };
    
    return this.http.post<string>(`${this.baseUrl}/save-consultation`, consultation, options).pipe(
      tap(() => {
        this.clearPatientCache(consultation.patientId);
        this.submittingSubject.next(false);
      }),
      catchError(error => {
        this.submittingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  getMedicalHistory(patientId: number, forceRefresh: boolean = false): Observable<Consultation[]> {
    console.log('Attempting to fetch medical history for patient:', patientId);
    console.log('Request URL:', `${this.baseUrl}/view-mh/${patientId}`);
    
    if (!forceRefresh && this.consultationsCache.has(patientId)) {
      const cachedData = this.consultationsCache.get(patientId)!;
      console.log('Returning cached data:', cachedData);
      return new Observable(observer => {
        observer.next(cachedData);
        observer.complete();
      });
    }

    this.loadingSubject.next(true);
    
    const options = {
      headers: this.getAuthHeaders()
    };
    
    console.log('Making HTTP request with headers:', options.headers);
    
    return this.http.get<Consultation[]>(`${this.baseUrl}/view-mh/${patientId}`, options).pipe(
      tap(consultations => {
        console.log('Received consultations:', consultations);
        this.consultationsCache.set(patientId, consultations);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('HTTP Error:', error);
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  getUpcomingAppointmentId(patientId: number, date: string): Observable<number> {
    console.log('Fetching upcoming appointment for patient:', patientId, 'on date:', date);
    
    const options = {
      headers: this.getAuthHeaders(),
      params: {
        patientId: patientId.toString(),
        date: date
      }
    };
    
    return this.http.get<number>(`${this.baseUrl}/upcoming`, options).pipe(
      tap(appointmentId => {
        console.log('Received upcoming appointment ID:', appointmentId);
      }),
      catchError(error => {
        console.error('Error fetching upcoming appointment:', error);
        return this.handleError(error);
      })
    );
  }

  getPatientByPhone(phone: number): Observable<number> {
    console.log('Fetching patient ID for phone number:', phone);
    
    const options = {
      headers: this.getAuthHeaders()
    };
    
    return this.http.get<number>(`${this.baseUrl}/get-patient-id/by-phone/${phone}`, options).pipe(
      tap(patientId => {
        console.log('Received patient ID:', patientId);
      }),
      catchError(error => {
        console.error('Error fetching patient by phone:', error);
        return this.handleError(error);
      })
    );
  }

  clearPatientCache(patientId: number): void {
    this.consultationsCache.delete(patientId);
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Unauthorized: Invalid or expired authentication token';
      } else if (error.status === 403) {
        errorMessage = 'Forbidden: You do not have permission to access this resource';
      } else if (error.error && typeof error.error === 'object') {
        const exceptionResponse = error.error as ExceptionResponse;
        errorMessage = `${exceptionResponse.message}: ${exceptionResponse.details}`;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Please check if the backend is running on http://localhost:8081';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint not found. Please check your backend API endpoints.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request data. Please check your input fields.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please check your backend logs.';
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText || 'Unknown error occurred'}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  };
}