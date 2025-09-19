import { Component, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export interface Availability {
  doctorID: number;
  date: string;
  timeSlots: string[];
  doctorName?: string;
  specialty?: string;
}

export interface Appointment {
  id: number;
  doctorId: number;
  patientId: number;
  date: string;
  slot: string;
  status?: string;
  patientName?: string;
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private baseUrl = 'http://localhost:8081/api/v1/availability';
  private appointmentsUrl = 'http://localhost:8081/appointments';

  constructor(private http: HttpClient) {}

  getAvailabilityByDoctor(doctorID: number, startDate: string, endDate: string): Observable<Availability[]> {
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<Availability[]>(`${this.baseUrl}/doctor/${doctorID}?startDate=${startDate}&endDate=${endDate}`, { headers });
  }

  addAvailability(availability: Availability): Observable<Availability> {
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post<Availability>(this.baseUrl, availability, { headers });
  }

  deleteAvailability(doctorID: number, date: string): Observable<void> {
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.delete<void>(`${this.baseUrl}/${doctorID}/${date}`, { headers });
  }

  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<Appointment[]>(`${this.appointmentsUrl}/doctor/${doctorId}`, { headers });
  }
}

@Component({
  selector: 'app-doctor-availabilty',
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-availabilty.html',
  styleUrl: './doctor-availabilty.css'
})
export class DoctorAvailabilty implements OnInit {
  // User & Role Management
  userRole: string | null = null;
  currentUserId = 0;
  doctorName = '';
  specialty = '';

  // Search Properties
  searchDoctorID: number | null = null;
  startDate = '';
  endDate = '';
  isLoading = false;

  // Data Arrays
  availabilities: Availability[] = [];
  appointments: Appointment[] = [];

  // UI State
  showAppointments = false;
  message = '';
  messageType: 'success' | 'error' | 'warning' | '' = '';

  // Add Form
  doctorID: number | null = null;
  date = '';
  selectedTimeSlots: string[] = [];
  availableTimeSlots = this.generateTimeSlots();
  isSubmitting = false;

  // Update Modal
  showUpdateModal = false;
  originalDoctorID = 0;
  originalDate = '';
  updateDoctorID: number | null = null;
  updateDate = '';
  updateSelectedTimeSlots: string[] = [];

  constructor(
    private availabilityService: AvailabilityService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeUser();
    setTimeout(() => this.loadAppointments(), 1000);
  }

  // User Initialization
  private initializeUser() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole = payload.role || payload.user_type;
      this.currentUserId = payload.id || payload.userId || 0;
      this.doctorID = this.currentUserId;
      this.searchDoctorID = this.currentUserId;
      this.doctorName = payload.name || payload.sub || 'Doctor';

      if (this.userRole === 'DOCTOR') {
        this.loadDoctorSpecialization();
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }

  private loadDoctorSpecialization() {
    const token = this.authService.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userEmail = payload.sub || payload.email;

      if (userEmail?.trim()) {
        this.authService.getUserByEmail(userEmail).subscribe({
          next: (doctor) => this.specialty = doctor?.specialisation || 'General Medicine',
          error: () => this.specialty = 'General Medicine'
        });
      } else {
        this.specialty = 'General Medicine';
      }
    } catch (error) {
      this.specialty = 'General Medicine';
    }
  }

  // Appointments Management
  loadAppointments() {
    if (!this.currentUserId) return;

    this.availabilityService.getAppointmentsByDoctor(this.currentUserId).subscribe({
      next: (appointments) => {
        this.appointments = appointments.map(apt => ({
          ...apt,
          patientName: `Patient #${apt.patientId}`,
          status: this.getAppointmentStatus(apt.slot)
        }));
      },
      error: (error) => console.error('Error loading appointments:', error)
    });
  }

  getAppointmentStatus(slot: string): string {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const slotTime = parseInt(slot.replace(':', ''));

    if (slotTime < currentTime - 100) return 'Completed';
    if (slotTime <= currentTime + 30) return 'In Progress';
    return 'Upcoming';
  }

  toggleAppointmentsView() {
    this.showAppointments = !this.showAppointments;
    if (this.showAppointments) this.loadAppointments();
  }

  // Permission Checks
  canManageAvailability(): boolean {
    return this.userRole === 'DOCTOR';
  }

  isCurrentDoctor(doctorId: number): boolean {
    return this.userRole === 'DOCTOR' && this.currentUserId === doctorId;
  }

  // Search Functionality
  searchAvailability() {
    if (!this.validateSearch()) return;

    this.isLoading = true;

    if (!this.searchDoctorID && this.userRole === 'PATIENT') {
      this.searchAllDoctors();
    } else {
      this.availabilityService.getAvailabilityByDoctor(this.searchDoctorID!, this.startDate, this.endDate).subscribe({
        next: (data) => {
          this.availabilities = data || [];
          this.showMessage(
            data?.length ? `Found ${data.length} availability record(s)` : 'No availability found for the selected criteria',
            data?.length ? 'success' : 'warning'
          );
        },
        error: () => this.showMessage('Error fetching availability data. Please try again.', 'error'),
        complete: () => this.isLoading = false
      });
    }
  }

  private validateSearch(): boolean {
    if (this.userRole === 'DOCTOR' && !this.searchDoctorID) {
      this.showMessage('Doctor ID is required for your account', 'error');
      return false;
    }
    if (this.searchDoctorID && this.searchDoctorID <= 0) {
      this.showMessage('Doctor ID must be a positive number', 'error');
      return false;
    }
    if (!this.startDate) {
      this.showMessage('Please select start date', 'error');
      return false;
    }
    if (!this.endDate) {
      this.showMessage('Please select end date', 'error');
      return false;
    }
    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.showMessage('Start date cannot be after end date', 'error');
      return false;
    }
    return true;
  }

  private searchAllDoctors() {
    const doctorIds = Array.from({ length: 10 }, (_, i) => i + 1);
    const allAvailabilities: Availability[] = [];
    let completedRequests = 0;

    doctorIds.forEach(doctorId => {
      this.availabilityService.getAvailabilityByDoctor(doctorId, this.startDate, this.endDate).subscribe({
        next: (data) => {
          if (data?.length) allAvailabilities.push(...data);
          this.handleSearchCompletion(++completedRequests, doctorIds.length, allAvailabilities);
        },
        error: () => this.handleSearchCompletion(++completedRequests, doctorIds.length, allAvailabilities)
      });
    });
  }

  private handleSearchCompletion(completed: number, total: number, results: Availability[]) {
    if (completed === total) {
      this.availabilities = results;
      this.showMessage(
        results.length ? `Found ${results.length} availability record(s)` : 'No doctors available for the selected dates',
        results.length ? 'success' : 'warning'
      );
      this.isLoading = false;
    }
  }

  // CRUD Operations
  onSubmit() {
    if (!this.validateForm()) return;

    this.isSubmitting = true;
    this.availabilityService.addAvailability({
      doctorID: this.doctorID!,
      date: this.date,
      timeSlots: this.selectedTimeSlots,
      doctorName: this.doctorName || `Dr. ${this.doctorID}`,
      specialty: this.specialty || 'General Medicine'
    }).subscribe({
      next: () => {
        this.showCustomAlert('success', 'Availability Created', `Schedule successfully added for ${this.doctorName} on ${this.date}`);
        this.resetAddForm();
        this.refreshIfSearchActive();
      },
      error: (error) => {
        this.showMessage(
          error.status === 409 ? 'Schedule already exists for this date' : 'Failed to add availability',
          error.status === 409 ? 'warning' : 'error'
        );
      },
      complete: () => this.isSubmitting = false
    });
  }

  deleteAvailability(doctorID: number, date: string) {
    if (!confirm('Are you sure you want to delete this availability?')) return;

    this.availabilityService.deleteAvailability(doctorID, date).subscribe({
      next: () => {
        this.availabilities = this.availabilities.filter(a => !(a.doctorID === doctorID && a.date === date));
        this.showMessage('Availability deleted successfully', 'success');
      },
      error: () => this.showMessage('Failed to delete availability', 'error')
    });
  }

  // Update Modal
  openUpdateModal(availability: Availability) {
    this.originalDoctorID = availability.doctorID;
    this.originalDate = availability.date;
    this.updateDoctorID = availability.doctorID;
    this.updateDate = availability.date;
    this.updateSelectedTimeSlots = [...availability.timeSlots];
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
  }

  onUpdateSubmit() {
    if (!this.validateUpdateForm()) return;

    this.isSubmitting = true;
    this.availabilityService.deleteAvailability(this.originalDoctorID, this.originalDate).subscribe({
      next: () => {
        this.availabilityService.addAvailability({
          doctorID: this.updateDoctorID!,
          date: this.updateDate,
          timeSlots: this.updateSelectedTimeSlots
        }).subscribe({
          next: () => {
            this.showMessage('Availability updated successfully', 'success');
            this.closeUpdateModal();
            this.refreshIfSearchActive();
          },
          error: () => this.showMessage('Failed to update availability', 'error'),
          complete: () => this.isSubmitting = false
        });
      },
      error: () => {
        this.showMessage('Failed to update availability', 'error');
        this.isSubmitting = false;
      }
    });
  }

  // Time Slots Management
  generateTimeSlots(): string[] {
    return Array.from({ length: 9 }, (_, i) => {
      const hour = i + 9;
      return `${this.formatTime(hour)} - ${this.formatTime(hour + 1)}`;
    });
  }

  private formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  toggleTimeSlot(slot: string) {
    const index = this.selectedTimeSlots.indexOf(slot);
    index > -1 ? this.selectedTimeSlots.splice(index, 1) : this.selectedTimeSlots.push(slot);
  }

  toggleUpdateTimeSlot(slot: string) {
    const index = this.updateSelectedTimeSlots.indexOf(slot);
    index > -1 ? this.updateSelectedTimeSlots.splice(index, 1) : this.updateSelectedTimeSlots.push(slot);
  }

  isSlotSelected(slot: string): boolean {
    return this.selectedTimeSlots.includes(slot);
  }

  isUpdateSlotSelected(slot: string): boolean {
    return this.updateSelectedTimeSlots.includes(slot);
  }

  // Validation
  private validateForm(): boolean {
    if (!this.doctorID || this.doctorID <= 0) {
      this.showMessage('Please enter a valid Doctor ID', 'error');
      return false;
    }
    if (!this.date) {
      this.showMessage('Please select a date', 'error');
      return false;
    }
    if (new Date(this.date) < new Date(new Date().toDateString())) {
      this.showMessage('Date cannot be in the past', 'error');
      return false;
    }
    if (!this.selectedTimeSlots.length) {
      this.showMessage('Please select at least one time slot', 'error');
      return false;
    }
    if (this.selectedTimeSlots.length > 8) {
      this.showMessage('Maximum 8 time slots allowed per day', 'error');
      return false;
    }
    return true;
  }

  private validateUpdateForm(): boolean {
    if (!this.updateDoctorID || this.updateDoctorID <= 0) {
      this.showMessage('Please enter a valid Doctor ID', 'error');
      return false;
    }
    if (!this.updateDate) {
      this.showMessage('Please select a date', 'error');
      return false;
    }
    if (new Date(this.updateDate) < new Date(new Date().toDateString())) {
      this.showMessage('Date cannot be in the past', 'error');
      return false;
    }
    if (!this.updateSelectedTimeSlots.length) {
      this.showMessage('Please select at least one time slot', 'error');
      return false;
    }
    return true;
  }

  // Utility Methods
  private resetAddForm() {
    this.doctorID = this.currentUserId;
    this.date = '';
    this.selectedTimeSlots = [];
  }

  private refreshIfSearchActive() {
    if (this.searchDoctorID && this.startDate && this.endDate) {
      this.searchAvailability();
    }
  }

  bookAppointment(availability: Availability) {
    if (this.userRole !== 'PATIENT') {
      this.showMessage('Please login as a patient to book appointments', 'warning');
      return;
    }
    this.showMessage(`Appointment booking for Dr. ${availability.doctorID} on ${availability.date} - Feature coming soon!`, 'success');
  }

  // Alert System
  private showMessage(text: string, type: 'success' | 'error' | 'warning') {
    this.message = text.replace(/[🎉✅❌⚠️ℹ️👨⚕️📅🗑️]/g, '').trim();
    this.messageType = type;
    setTimeout(() => this.message = '', 5000);
  }

  showCustomAlert(type: 'success' | 'error' | 'warning', title: string, message: string) {
    const alertBox = document.createElement('div');
    alertBox.className = `custom-alert-box alert-${type}`;
    alertBox.innerHTML = `
      <div class="alert-icon">${this.getAlertIcon(type)}</div>
      <div class="alert-content">
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
      </div>
      <button class="alert-close-btn" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(alertBox);
    setTimeout(() => {
      if (alertBox.parentElement) {
        alertBox.classList.add('fade-out');
        setTimeout(() => alertBox.remove(), 300);
      }
    }, 4000);
  }

  private getAlertIcon(type: string): string {
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    return icons[type as keyof typeof icons] || '✅';
  }
}