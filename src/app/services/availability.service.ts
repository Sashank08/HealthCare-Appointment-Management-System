import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Availability {
  doctorID: number;
  date: string;
  timeSlots: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private baseUrl = 'http://localhost:8084/api/v1/availability';

  constructor(private http: HttpClient) {}

  getAllAvailability(): Observable<Availability[]> {
    return this.http.get<Availability[]>(this.baseUrl);
  }

  getAvailabilityById(doctorID: number, date: string): Observable<Availability> {
    return this.http.get<Availability>(`${this.baseUrl}/${doctorID}/${date}`);
  }

  getAvailabilityByDoctor(doctorID: number, startDate: string, endDate: string): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.baseUrl}/doctor/${doctorID}?startDate=${startDate}&endDate=${endDate}`);
  }

  checkAvailability(doctorID: number, date: string, timeSlot: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/check?doctorID=${doctorID}&date=${date}&timeSlot=${timeSlot}`);
  }

  addAvailability(availability: Availability): Observable<Availability> {
    return this.http.post<Availability>(this.baseUrl, availability);
  }

  updateAvailability(doctorID: number, date: string, availability: Availability): Observable<Availability> {
    return this.http.put<Availability>(`${this.baseUrl}/${doctorID}/${date}`, availability);
  }

  deleteAvailability(doctorID: number, date: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${doctorID}/${date}`);
  }

  getDoctorIdByPhone(phone: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/get-doctor-id/by-phone/${phone}`);
  }
}