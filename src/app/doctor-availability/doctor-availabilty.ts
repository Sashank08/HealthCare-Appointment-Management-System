import { Component, OnInit, OnDestroy, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

export interface TimeSlot {
  value: string;
  display: string;
  selected: boolean;
}

@Injectable({
  providedIn: 'root'
})
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

  updateAvailability(doctorID: number, date: string, availability: Availability): Observable<Availability> {
    const token = localStorage.getItem('authToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.put<Availability>(`${this.baseUrl}/${doctorID}/${date}`, availability, { headers });
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
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-availabilty.html',
  styleUrl: './doctor-availabilty.css'
})
export class DoctorAvailabilty implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // User & Role Management
  userRole: string | null = null;
  currentUserId = 0;
  doctorName = '';
  specialty = '';

  // Forms
  searchForm: FormGroup;
  availabilityForm: FormGroup;

  // Data Arrays
  availabilities: Availability[] = [];
  appointments: Appointment[] = [];
  timeSlots: TimeSlot[] = [];

  // UI State
  selectedTabIndex = 0;
  isLoading = false;
  isSubmitting = false;
  isEditing = false;
  editingAvailability: Availability | null = null;
  showDeleteModal = false;
  deleteTarget: Availability | null = null;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  showToast = false;
  showSuccessModal = false;
  minDate = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private availabilityService: AvailabilityService
  ) {
    this.initializeForms();
    this.generateTimeSlots();
  }

  ngOnInit() {
    this.initializeUser();
    this.loadAppointments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms() {
    this.searchForm = this.fb.group({
      doctorID: [null, [Validators.min(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });

    this.availabilityForm = this.fb.group({
      doctorID: [{ value: '', disabled: true }, Validators.required],
      doctorName: [{ value: '', disabled: true }],
      specialty: [{ value: '', disabled: true }],
      date: ['', Validators.required]
    });
  }

  private generateTimeSlots() {
    this.timeSlots = Array.from({ length: 9 }, (_, i) => {
      const hour = i + 9;
      const display = `${this.formatTime(hour)} - ${this.formatTime(hour + 1)}`;
      return {
        value: display,
        display,
        selected: false
      };
    });
  }

  private formatTime(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  private initializeUser() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole = payload.role || payload.user_type;
      this.currentUserId = payload.id || payload.userId || 0;
      this.doctorName = payload.name || payload.sub || 'Doctor';

      // Update forms with user data
      this.availabilityForm.patchValue({
        doctorID: this.currentUserId,
        doctorName: this.doctorName
      });

      this.searchForm.patchValue({
        doctorID: this.currentUserId
      });

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
        this.authService.getUserByEmail(userEmail)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (doctor) => {
              this.specialty = doctor?.specialisation || 'General Medicine';
              this.availabilityForm.patchValue({ specialty: this.specialty });
            },
            error: () => {
              this.specialty = 'General Medicine';
              this.availabilityForm.patchValue({ specialty: this.specialty });
            }
          });
      }
    } catch (error) {
      this.specialty = 'General Medicine';
      this.availabilityForm.patchValue({ specialty: this.specialty });
    }
  }

  loadAppointments() {
    if (!this.currentUserId) return;

    this.availabilityService.getAppointmentsByDoctor(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments.map(apt => ({
            ...apt,
            patientName: apt.patientName || `Patient ${apt.patientId}`,
            status: this.getAppointmentStatus(apt.date, apt.slot)
          }));
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.showToastNotification('Error loading appointments', 'error');
        }
      });
  }

  getAppointmentStatus(appointmentDate: string, slot: string): string {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Parse slot time (e.g., "9:00 AM - 10:00 AM" -> 540 minutes)
    const timeMatch = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (!timeMatch) return 'Unknown';
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3];
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const slotTime = hours * 60 + minutes;
    
    if (appointmentDate < today) return 'Completed';
    if (appointmentDate > today) return 'Upcoming';
    
    // Same day - check time
    if (slotTime < currentTime - 60) return 'Completed';
    if (slotTime <= currentTime + 30) return 'In Progress';
    return 'Upcoming';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Upcoming': return 'primary';
      default: return 'secondary';
    }
  }

  // Permission Checks
  canManageAvailability(): boolean {
    return this.userRole === 'DOCTOR';
  }

  isCurrentDoctor(doctorId: number): boolean {
    return this.userRole === 'DOCTOR' && this.currentUserId === doctorId;
  }

  // Search Functionality
  onSearch() {
    if (this.searchForm.invalid) {
      this.markFormGroupTouched(this.searchForm);
      return;
    }

    const { doctorID, startDate, endDate } = this.searchForm.value;
    
    if (new Date(startDate) > new Date(endDate)) {
      this.showToastNotification('Start date cannot be after end date', 'error');
      return;
    }

    this.isLoading = true;

    if (!doctorID && this.userRole === 'PATIENT') {
      this.searchAllDoctors(startDate, endDate);
    } else {
      this.availabilityService.getAvailabilityByDoctor(doctorID, this.formatDateString(startDate), this.formatDateString(endDate))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.availabilities = data || [];
            this.showToastNotification(
              data?.length ? `Found ${data.length} availability record(s)` : 'No availability found',
              data?.length ? 'success' : 'warning'
            );
          },
          error: () => {
            this.showToastNotification('Error fetching availability data', 'error');
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    }
  }

  private searchAllDoctors(startDate: string, endDate: string) {
    const doctorIds = Array.from({ length: 10 }, (_, i) => i + 1);
    const allAvailabilities: Availability[] = [];
    let completedRequests = 0;

    doctorIds.forEach(doctorId => {
      this.availabilityService.getAvailabilityByDoctor(doctorId, this.formatDateString(startDate), this.formatDateString(endDate))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            if (data?.length) allAvailabilities.push(...data);
            this.handleSearchCompletion(++completedRequests, doctorIds.length, allAvailabilities);
          },
          error: () => {
            this.handleSearchCompletion(++completedRequests, doctorIds.length, allAvailabilities);
          }
        });
    });
  }

  private handleSearchCompletion(completed: number, total: number, results: Availability[]) {
    if (completed === total) {
      this.availabilities = results;
      this.showToastNotification(
        results.length ? `Found ${results.length} availability record(s)` : 'No doctors available',
        results.length ? 'success' : 'warning'
      );
      this.isLoading = false;
    }
  }

  // Time Slot Management
  toggleTimeSlot(slot: TimeSlot) {
    slot.selected = !slot.selected;
  }

  getSelectedTimeSlots(): string[] {
    return this.timeSlots.filter(slot => slot.selected).map(slot => slot.value);
  }

  // CRUD Operations
  onSubmit() {
    if (this.availabilityForm.invalid) {
      this.markFormGroupTouched(this.availabilityForm);
      return;
    }

    const selectedSlots = this.getSelectedTimeSlots();
    if (!selectedSlots.length) {
      this.showToastNotification('Please select at least one time slot', 'error');
      return;
    }

    if (selectedSlots.length > 8) {
      this.showToastNotification('Maximum 8 time slots allowed per day', 'error');
      return;
    }

    const formValue = this.availabilityForm.getRawValue();
    const availability: Availability = {
      doctorID: formValue.doctorID,
      date: this.formatDateString(formValue.date),
      timeSlots: selectedSlots,
      doctorName: formValue.doctorName,
      specialty: formValue.specialty
    };

    this.isSubmitting = true;

    if (this.isEditing && this.editingAvailability) {
      this.availabilityService.updateAvailability(availability.doctorID, availability.date, availability)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showToastNotification('Availability updated successfully', 'success');
            this.isEditing = false;
            this.editingAvailability = null;
            this.resetForm();
            this.refreshSearch();
            this.selectedTabIndex = 0;
          },
          error: (error) => {
            const message = error.status === 409 ? 'Schedule conflict detected' : 'Failed to update availability';
            this.showToastNotification(message, 'error');
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
    } else {
      this.availabilityService.addAvailability(availability)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccessModal = true;
            this.resetForm();
            this.refreshSearch();
            setTimeout(() => {
              this.showSuccessModal = false;
              this.selectedTabIndex = 0;
            }, 3000);
          },
          error: (error) => {
            const message = error.status === 409 ? 'Schedule already exists for this date' : 'Failed to add availability';
            this.showToastNotification(message, 'error');
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
    }
  }

  editAvailability(availability: Availability) {
    this.isEditing = true;
    this.editingAvailability = { ...availability };
    
    this.selectedTabIndex = 2;
    
    this.availabilityForm.patchValue({
      doctorID: availability.doctorID,
      date: availability.date,
      doctorName: availability.doctorName,
      specialty: availability.specialty
    });
    
    this.timeSlots.forEach(slot => {
      slot.selected = availability.timeSlots.includes(slot.value);
    });
    
    this.showToastNotification('Editing availability - modify slots and save', 'warning');
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingAvailability = null;
    this.resetForm();
    this.showToastNotification('Edit cancelled', 'warning');
  }

  openDeleteModal(availability: Availability) {
    this.deleteTarget = availability;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete() {
    if (!this.deleteTarget) return;

    this.availabilityService.deleteAvailability(this.deleteTarget.doctorID, this.deleteTarget.date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.availabilities = this.availabilities.filter(
            a => !(a.doctorID === this.deleteTarget!.doctorID && a.date === this.deleteTarget!.date)
          );
          this.showToastNotification('Availability deleted successfully', 'success');
          this.closeDeleteModal();
        },
        error: () => {
          this.showToastNotification('Failed to delete availability', 'error');
          this.closeDeleteModal();
        }
      });
  }

  // Utility Methods
  private resetForm() {
    this.availabilityForm.patchValue({ date: '' });
    this.timeSlots.forEach(slot => slot.selected = false);
    this.isEditing = false;
    this.editingAvailability = null;
  }

  private refreshSearch() {
    if (this.searchForm.valid) {
      this.onSearch();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private formatDateString(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }



  showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  closeToast() {
    this.showToast = false;
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.selectedTabIndex = 0;
  }

  // Toggle appointments view
  toggleAppointmentsView() {
    this.selectedTabIndex = this.selectedTabIndex === 0 ? 1 : 0;
    if (this.selectedTabIndex === 1) {
      this.loadAppointments();
    }
  }

  getAppointmentsByStatus(status: string): Appointment[] {
    return this.appointments.filter(apt => apt.status === status);
  }

  bookAppointment(availability: Availability) {
    if (this.userRole !== 'PATIENT') {
      this.showToastNotification('Please login as a patient to book appointments', 'warning');
      return;
    }
    this.showToastNotification(`Appointment booking for Dr. ${availability.doctorName || 'Doctor'} on ${availability.date} - Feature coming soon!`, 'info');
  }
}