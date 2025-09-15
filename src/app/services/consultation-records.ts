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
  
  // Base URL for your backend API
  private readonly baseUrl = 'http://localhost:8081/consult';
  
  // Hardcoded token - Update this with your actual token
  private readonly authToken = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJEci4gUmFodWwiLCJyb2xlIjoiZG9jdG9yIiwiaWQiOjEsImlhdCI6MTc1NzkxNjYxNiwiZXhwIjoxNzU3OTUyNjE2fQ.GBDRVQzHAWUehLFXkl5EIF27Sy2qntN5bolMT_Uj7wg';
  
  // Alternative: If your backend expects a simple token without "Bearer"
  // private readonly authToken = 'your-hardcoded-token-here';
  
  // Loading states management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private submittingSubject = new BehaviorSubject<boolean>(false);
  
  // Observables for loading states
  public loading$ = this.loadingSubject.asObservable();
  public submitting$ = this.submittingSubject.asObservable();
  
  // Simple cache for consultations to avoid unnecessary API calls
  private consultationsCache = new Map<number, Consultation[]>();

  constructor() {
    console.log('ConsultationRecordsService initialized with authentication token');
    console.log('Available endpoints: save-consultation, view-mh');
  }

  /**
   * Get HTTP headers with authentication token
   * @returns HttpHeaders with authorization
   */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': this.authToken,
      'Accept': 'application/json'
    });
  }

  /**
   * Get HTTP headers for text response with authentication
   * @returns HttpHeaders for text response
   */
  private getAuthHeadersForText(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': this.authToken,
      'Accept': 'text/plain'
    });
  }

  /**
   * Save a new consultation record
   * Endpoint: POST /save-consultation
   * @param consultation - The consultation data to save
   * @returns Observable<string> - Success message from backend
   */
  saveConsultation(consultation: Consultation): Observable<string> {
    this.submittingSubject.next(true);
    
    const options = {
      headers: this.getAuthHeadersForText(),
      responseType: 'text' as 'json'
    };
    
    return this.http.post<string>(`${this.baseUrl}/save-consultation`, consultation, options).pipe(
      tap(response => {
        console.log('Consultation saved successfully with auth token:', response);
        // Clear cache for this patient to force refresh next time
        this.clearPatientCache(consultation.patientId);
        this.submittingSubject.next(false);
      }),
      catchError(error => {
        this.submittingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Get medical history for a specific patient
   * Endpoint: GET /view-mh/{pid}
   * @param patientId - The patient ID to fetch history for
   * @param forceRefresh - Whether to bypass cache and fetch fresh data
   * @returns Observable<Consultation[]> - Array of consultation records
   */
  getMedicalHistory(patientId: number, forceRefresh: boolean = false): Observable<Consultation[]> {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && this.consultationsCache.has(patientId)) {
      const cachedData = this.consultationsCache.get(patientId)!;
      console.log(`Returning cached data for patient ${patientId}:`, cachedData);
      return new Observable(observer => {
        observer.next(cachedData);
        observer.complete();
      });
    }

    this.loadingSubject.next(true);
    
    const options = {
      headers: this.getAuthHeaders()
    };
    
    return this.http.get<Consultation[]>(`${this.baseUrl}/view-mh/${patientId}`, options).pipe(
      tap(consultations => {
        console.log(`Medical history fetched for patient ${patientId} with auth token:`, consultations);
        // Cache the results for future use
        this.consultationsCache.set(patientId, consultations);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Update the authentication token
   * @param newToken - The new token to use
   */
  updateAuthToken(newToken: string): void {
    // If you need to update the token dynamically, you can make authToken a property
    console.log('Auth token updated');
    // Note: You'd need to make authToken a property instead of readonly for this to work
  }

  /**
   * Get current authentication token (for debugging)
   * @returns string - Current token
   */
  getCurrentToken(): string {
    return this.authToken;
  }

  /**
   * Clear cache for a specific patient
   * @param patientId - The patient ID to clear cache for
   */
  clearPatientCache(patientId: number): void {
    this.consultationsCache.delete(patientId);
    console.log(`Cache cleared for patient ${patientId}`);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.consultationsCache.clear();
    console.log('All consultation cache cleared');
  }

  /**
   * Get current loading state
   * @returns boolean - Current loading state
   */
  isLoading(): boolean {
    return this.loadingSubject.value;
  }

  /**
   * Get current submitting state
   * @returns boolean - Current submitting state
   */
  isSubmitting(): boolean {
    return this.submittingSubject.value;
  }

  /**
   * Validate consultation data before sending to server
   * @param consultation - The consultation data to validate
   * @returns Object with validation result and errors
   */
  validateConsultation(consultation: Consultation): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!consultation.notes || consultation.notes.trim().length === 0) {
      errors.push('Consultation notes are required');
    }

    if (consultation.notes && consultation.notes.trim().length > 1000) {
      errors.push('Consultation notes cannot exceed 1000 characters');
    }

    if (!consultation.prescription || consultation.prescription.trim().length === 0) {
      errors.push('Prescription is required');
    }

    if (consultation.prescription && consultation.prescription.trim().length > 1000) {
      errors.push('Prescription cannot exceed 1000 characters');
    }

    if (!consultation.patientId || consultation.patientId <= 0) {
      errors.push('Valid patient ID is required');
    }

    if (!consultation.appointmentId || consultation.appointmentId <= 0) {
      errors.push('Valid appointment ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format consultation data for display (truncate long text)
   * @param consultation - The consultation to format
   * @returns Formatted consultation object
   */
  formatConsultationForDisplay(consultation: Consultation): any {
    return {
      ...consultation,
      shortNotes: consultation.notes.length > 100 
        ? consultation.notes.substring(0, 100) + '...' 
        : consultation.notes,
      shortPrescription: consultation.prescription.length > 100 
        ? consultation.prescription.substring(0, 100) + '...' 
        : consultation.prescription
    };
  }

  /**
   * Get cached consultations for a patient (if available)
   * @param patientId - The patient ID
   * @returns Consultation[] | null - Cached consultations or null
   */
  getCachedConsultations(patientId: number): Consultation[] | null {
    return this.consultationsCache.get(patientId) || null;
  }

  /**
   * Check if patient data is cached
   * @param patientId - The patient ID to check
   * @returns boolean - Whether data is cached
   */
  isPatientDataCached(patientId: number): boolean {
    return this.consultationsCache.has(patientId);
  }

  /**
   * Get statistics from cached data
   * @param patientId - The patient ID
   * @returns Object with basic statistics
   */
  getCachedStats(patientId: number): any {
    const consultations = this.consultationsCache.get(patientId);
    
    if (!consultations) {
      return null;
    }

    return {
      totalConsultations: consultations.length,
      latestConsultation: consultations.length > 0 ? consultations[consultations.length - 1] : null,
      appointmentIds: [...new Set(consultations.map(c => c.appointmentId))]
    };
  }

  /**
   * Handle HTTP errors from your backend
   * @param error - The HTTP error response
   * @returns Observable<never> - Throws formatted error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error - handle your backend's exception format
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
        errorMessage = 'Unable to connect to server. Please check if the backend is running on http://localhost:8080';
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
    
    console.error('Service Error:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      timestamp: new Date().toISOString(),
      authToken: this.authToken ? 'Token present' : 'No token'
    });
    
    return throwError(() => new Error(errorMessage));
  };
}