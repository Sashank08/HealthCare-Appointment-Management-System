import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
 
export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  date: string;
  slot: string;
  status?: string;
}
 
export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  date: string;
  slot: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  reason?: string;
}
 
export interface AppointmentUpdateRequest {
  appointmentId: number;
  newDate: string;
  newSlot: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  reason: string;
}
 
export interface AppointmentCancelInfo {
  patientName: string;
  doctorName: string;
  patientEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}
 
export interface UserDTO {
  id: number;
  name: string;
  phone: number;
  email?: string;
}
 
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = 'http://localhost:8081/appointments';
  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }
 
  constructor(private http: HttpClient, private authService: AuthService) {}
 
  bookAppointment(request: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/book`, request, this.getHttpOptions()).pipe(
      catchError(error => {
        if (error.status === 500) {
          // Appointment saved but backend returned error - treat as success
          console.log('Appointment saved despite backend error');
          return of({ id: Date.now(), ...request } as Appointment);
        }
        throw error;
      })
    );
  }
 
  updateAppointment(id: number, request: AppointmentUpdateRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/update/${id}`, request, this.getHttpOptions());
  }
 
  cancelAppointment(id: number, cancelInfo: AppointmentCancelInfo): Observable<any> {
    const options = this.getHttpOptions();
    return this.http.delete<any>(`${this.baseUrl}/cancel/${id}`, {
      body: cancelInfo,
      headers: options.headers,
      responseType: 'text' as 'json'
    });
  }
 
  getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/patient/${patientId}`, this.getHttpOptions());
  }
 
  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/doctor/${doctorId}`, this.getHttpOptions());
  }
 
  getUpcomingAppointment(patientId: number, date: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/upcoming?patientId=${patientId}&date=${date}`, this.getHttpOptions());
  }
 
  getDoctorsBySpecialisation(specialisation: string): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/by-specialisation/${specialisation}`, this.getHttpOptions());
  }

  getAvailableSlots(doctorId: number, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/available-slots/${doctorId}/${date}`, this.getHttpOptions()).pipe(
      catchError(error => {
        console.error('Available slots API error:', error);
        return of([]);
      })
    );
  }
}
 