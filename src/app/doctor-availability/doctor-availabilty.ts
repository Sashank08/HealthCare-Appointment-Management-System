import { Component, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  private baseUrl = 'http://localhost:8081/api/v1/availability';
 
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
}
 
@Component({
  selector: 'app-doctor-availabilty',
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-availabilty.html',
  styleUrl: './doctor-availabilty.css'
})
export class DoctorAvailabilty {
  userRole: string | null = null;
  currentUserId: number = 0;
  searchDoctorID: number | null = null;
  startDate = '';
  endDate = '';
  availabilities: Availability[] = [];
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' | 'warning' | '' = '';
 
  // Add form properties
  doctorID: number | null = null;
  date = '';
  selectedTimeSlots: string[] = [];
  availableTimeSlots = this.generateTimeSlots();
  isSubmitting = false;
  showAddForm = false;
 
  // Update form properties
  selectedAvailability: Availability | null = null;
  showUpdateModal = false;
  originalDoctorID = 0;
  originalDate = '';
  updateDoctorID: number | null = null;
  updateDate = '';
  updateSelectedTimeSlots: string[] = [];
 
  constructor(private availabilityService: AvailabilityService, private http: HttpClient) {
    this.doctorID = 1;
    this.searchDoctorID = 1;
    this.currentUserId = 1;
    this.initializeUserRole();
    this.fetchCorrectUserId();
  }

  private fetchCorrectUserId() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = payload.userId || payload.id || 1;
        this.doctorID = this.currentUserId;
        this.searchDoctorID = this.currentUserId;
        console.log('User ID from token:', this.currentUserId);
      } catch (error) {
        console.error('Error extracting user ID from token:', error);
        this.currentUserId = 1;
        this.doctorID = 1;
        this.searchDoctorID = 1;
      }
    }
  }

  private initializeUserRole() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userRole = payload.role || payload.user_type;
        this.currentUserId = payload.userId || payload.id || 0;
        
        // Auto-populate doctor ID for all users
        this.doctorID = this.currentUserId;
        this.searchDoctorID = this.currentUserId;
        
        console.log('User role:', this.userRole, 'User ID:', this.currentUserId, 'Doctor ID set to:', this.doctorID);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }

  canManageAvailability(): boolean {
    return this.userRole === 'DOCTOR';
  }

  canViewAllDoctors(): boolean {
    return this.userRole === 'PATIENT' || this.userRole === 'ADMIN';
  }

  isCurrentDoctor(doctorId: number): boolean {
    return this.userRole === 'DOCTOR' && this.currentUserId === doctorId;
  }

  bookAppointment(availability: Availability) {
    if (this.userRole !== 'PATIENT') {
      this.showMessage('⚠️ Please login as a patient to book appointments', 'warning');
      return;
    }
    
    // For now, show a message - this would integrate with appointment booking system
    this.showMessage(`📅 Appointment booking for Dr. ${availability.doctorID} on ${availability.date} - Feature coming soon!`, 'success');
  }

  getDoctorInfoByPhone(phone: string) {
    if (!phone || phone.length !== 10) {
      this.showMessage('⚠️ Please enter a valid 10-digit phone number', 'warning');
      return;
    }
    this.http.get<any>(`http://localhost:8081/auth/by-phone/${phone}`).subscribe({
      next: (userData) => {
        if (userData) {
          console.log('Doctor info:', userData);
          this.showMessage(`👨‍⚕️ Found: Dr. ${userData.name} (ID: ${userData.id})`, 'success');
          
          if (userData.user_type === 'DOCTOR') {
            this.searchDoctorID = userData.id;
            if (this.userRole === 'DOCTOR') {
              this.doctorID = userData.id;
            }
          }
        }
      },
      error: (error) => {
        console.error('Error fetching doctor by phone:', error);
        this.showMessage('❌ Doctor not found with this phone number', 'error');
      }
    });
  }
 
  // Search functionality
  searchAvailability() {
    // Role-based validation
    if (this.userRole === 'DOCTOR' && !this.searchDoctorID) {
      this.showMessage('⚠️ Doctor ID is required for your account', 'error');
      return;
    }
    
    if (this.searchDoctorID && this.searchDoctorID <= 0) {
      this.showMessage('⚠️ Doctor ID must be a positive number', 'error');
      return;
    }
    
    if (!this.startDate) {
      this.showMessage('⚠️ Please select start date', 'error');
      return;
    }
    if (!this.endDate) {
      this.showMessage('⚠️ Please select end date', 'error');
      return;
    }
    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.showMessage('⚠️ Start date cannot be after end date', 'error');
      return;
    }
    if (new Date(this.endDate) < new Date()) {
      this.showMessage('⚠️ End date cannot be in the past', 'error');
      return;
    }
 
    this.isLoading = true;
    
    // If no doctor ID specified (patient searching all doctors), use a different approach
    if (!this.searchDoctorID && this.userRole === 'PATIENT') {
      // For now, we'll search with a default range of doctor IDs
      // In a real app, you'd have an endpoint to get all availabilities
      this.searchAllDoctors();
    } else {
      this.availabilityService.getAvailabilityByDoctor(this.searchDoctorID!, this.startDate, this.endDate).subscribe({
        next: (data) => {
          this.availabilities = data || [];
          if (data?.length) {
            this.showMessage(`✅ Found ${data.length} availability record(s)`, 'success');
          } else {
            this.showMessage('ℹ️ No availability found for the selected criteria', 'warning');
          }
        },
        error: () => this.showMessage('❌ Error fetching availability data. Please try again.', 'error'),
        complete: () => this.isLoading = false
      });
    }
  }
  
  private searchAllDoctors() {
    // Search multiple doctor IDs (1-10 as example)
    const doctorIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const allAvailabilities: Availability[] = [];
    let completedRequests = 0;
    
    doctorIds.forEach(doctorId => {
      this.availabilityService.getAvailabilityByDoctor(doctorId, this.startDate, this.endDate).subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            allAvailabilities.push(...data);
          }
          completedRequests++;
          
          if (completedRequests === doctorIds.length) {
            this.availabilities = allAvailabilities;
            if (allAvailabilities.length > 0) {
              this.showMessage(`✅ Found ${allAvailabilities.length} availability record(s) from ${new Set(allAvailabilities.map(a => a.doctorID)).size} doctor(s)`, 'success');
            } else {
              this.showMessage('ℹ️ No doctors available for the selected dates', 'warning');
            }
            this.isLoading = false;
          }
        },
        error: () => {
          completedRequests++;
          if (completedRequests === doctorIds.length) {
            this.availabilities = allAvailabilities;
            if (allAvailabilities.length > 0) {
              this.showMessage(`✅ Found ${allAvailabilities.length} availability record(s)`, 'success');
            } else {
              this.showMessage('❌ Error searching for available doctors', 'error');
            }
            this.isLoading = false;
          }
        }
      });
    });
  }
 
  deleteAvailability(doctorID: number, date: string) {
    if (!confirm('🗑️ Are you sure you want to delete this availability?\n\nThis action cannot be undone.')) return;
   
    this.availabilityService.deleteAvailability(doctorID, date).subscribe({
      next: () => {
        this.availabilities = this.availabilities.filter(a => !(a.doctorID === doctorID && a.date === date));
        this.showMessage('✅ Availability deleted successfully', 'success');
      },
      error: () => this.showMessage('❌ Failed to delete availability. Please try again.', 'error')
    });
  }
 
  // Add form functionality
  generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${this.formatTime(hour, 0)} - ${this.formatTime(hour + 1, 0)}`);
    }
    return slots;
  }
 
  private formatTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }
 
  toggleTimeSlot(slot: string) {
    const index = this.selectedTimeSlots.indexOf(slot);
    index > -1 ? this.selectedTimeSlots.splice(index, 1) : this.selectedTimeSlots.push(slot);
  }
 
  isSlotSelected(slot: string): boolean {
    return this.selectedTimeSlots.includes(slot);
  }
 
  onSubmit() {
    // Comprehensive validation
    if (!this.doctorID) {
      this.showMessage('⚠️ Please enter Doctor ID', 'error');
      return;
    }
    if (this.doctorID <= 0) {
      this.showMessage('⚠️ Doctor ID must be a positive number', 'error');
      return;
    }
    if (!this.date) {
      this.showMessage('⚠️ Please select a date', 'error');
      return;
    }
    if (new Date(this.date) < new Date(new Date().toDateString())) {
      this.showMessage('⚠️ Date cannot be in the past', 'error');
      return;
    }
    if (!this.selectedTimeSlots.length) {
      this.showMessage('⚠️ Please select at least one time slot', 'error');
      return;
    }
    if (this.selectedTimeSlots.length > 8) {
      this.showMessage('⚠️ Maximum 8 time slots allowed per day', 'error');
      return;
    }
 
    this.isSubmitting = true;
    this.availabilityService.addAvailability({
      doctorID: this.doctorID!,
      date: this.date,
      timeSlots: this.selectedTimeSlots
    }).subscribe({
      next: () => {
        this.showMessage(`✅ Availability added successfully for Dr. ${this.doctorID}!`, 'success');
        this.resetAddForm();
        this.refreshIfSearchActive();
      },
      error: (error) => {
        if (error.status === 409) {
          this.showMessage('⚠️ Schedule already exists for this date. Please choose a different date or update the existing availability.', 'warning');
        } else {
          this.showMessage('❌ Failed to add availability. Please try again.', 'error');
        }
        this.isSubmitting = false;
      },
      complete: () => this.isSubmitting = false
    });
  }
 
  private resetAddForm() {
    this.doctorID = this.currentUserId;
    this.date = '';
    this.selectedTimeSlots = [];
  }
 
  // Update form functionality
  openUpdateModal(availability: Availability) {
    this.selectedAvailability = availability;
    this.originalDoctorID = availability.doctorID;
    this.originalDate = availability.date;
    this.updateDoctorID = availability.doctorID;
    this.updateDate = availability.date;
    this.updateSelectedTimeSlots = [...availability.timeSlots];
    this.showUpdateModal = true;
  }
 
  closeUpdateModal() {
    this.showUpdateModal = false;
    this.selectedAvailability = null;
  }
 
  toggleUpdateTimeSlot(slot: string) {
    const index = this.updateSelectedTimeSlots.indexOf(slot);
    index > -1 ? this.updateSelectedTimeSlots.splice(index, 1) : this.updateSelectedTimeSlots.push(slot);
  }
 
  isUpdateSlotSelected(slot: string): boolean {
    return this.updateSelectedTimeSlots.includes(slot);
  }
 
  onUpdateSubmit() {
    // Comprehensive validation
    if (!this.updateDoctorID) {
      this.showMessage('⚠️ Please enter Doctor ID', 'error');
      return;
    }
    if (this.updateDoctorID <= 0) {
      this.showMessage('⚠️ Doctor ID must be a positive number', 'error');
      return;
    }
    if (!this.updateDate) {
      this.showMessage('⚠️ Please select a date', 'error');
      return;
    }
    if (new Date(this.updateDate) < new Date(new Date().toDateString())) {
      this.showMessage('⚠️ Date cannot be in the past', 'error');
      return;
    }
    if (!this.updateSelectedTimeSlots.length) {
      this.showMessage('⚠️ Please select at least one time slot', 'error');
      return;
    }
    if (this.updateSelectedTimeSlots.length > 8) {
      this.showMessage('⚠️ Maximum 8 time slots allowed per day', 'error');
      return;
    }
 
    this.isSubmitting = true;
    this.availabilityService.deleteAvailability(this.originalDoctorID, this.originalDate).subscribe({
      next: () => {
        this.availabilityService.addAvailability({
          doctorID: this.updateDoctorID!,
          date: this.updateDate,
          timeSlots: this.updateSelectedTimeSlots
        }).subscribe({
          next: () => {
            this.showMessage(`✅ Availability updated successfully for Dr. ${this.updateDoctorID}!`, 'success');
            this.closeUpdateModal();
            this.refreshIfSearchActive();
          },
          error: () => this.showMessage('❌ Failed to update availability. Please check if this schedule conflicts with existing data.', 'error'),
          complete: () => this.isSubmitting = false
        });
      },
      error: () => {
        this.showMessage('❌ Failed to update availability. Please try again.', 'error');
        this.isSubmitting = false;
      }
    });
  }
 
  private refreshIfSearchActive() {
    if (this.searchDoctorID && this.startDate && this.endDate) {
      this.searchAvailability();
    }
  }
 
  private showMessage(text: string, type: 'success' | 'error' | 'warning') {
    this.message = text;
    this.messageType = type;
   
    // Auto-hide success and warning messages, keep error messages longer
    const hideDelay = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, hideDelay);
  }
}
 