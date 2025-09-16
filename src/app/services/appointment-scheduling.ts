import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  id: number;
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

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = 'http://localhost:8082/appointments';

  constructor(private http: HttpClient) {}

  bookAppointment(request: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/book`, request);
  }

  updateAppointment(id: number, request: AppointmentUpdateRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/update/${id}`, request);
  }

  cancelAppointment(id: number, cancelInfo: AppointmentCancelInfo): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/cancel/${id}`, { body: cancelInfo });
  }

  getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/patient/${patientId}`);
  }
}
