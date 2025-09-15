import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Consultation {
  id?: number;
  doctorID: number;
  patientID: number;
  date: string;
  timeSlot: string;
  notes: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private baseUrl = 'http://localhost:8081/api/v1/consultations';

  constructor(private http: HttpClient) {}

  createConsultation(consultation: Consultation): Observable<Consultation> {
    return this.http.post<Consultation>(this.baseUrl, consultation);
  }

  getConsultationsByDoctor(doctorID: number): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.baseUrl}/doctor/${doctorID}`);
  }

  updateConsultation(id: number, consultation: Consultation): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.baseUrl}/${id}`, consultation);
  }

  deleteConsultation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}