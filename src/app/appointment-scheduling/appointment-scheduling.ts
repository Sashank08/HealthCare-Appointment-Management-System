import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentService, Appointment, AppointmentRequest, AppointmentUpdateRequest, AppointmentCancelInfo, UserDTO } from './appointment.service';
import { AuthService } from '../services/auth.service';
 
@Component({
  selector: 'app-appointment-scheduling',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './appointment-scheduling.html',
  styleUrls: ['./appointment-scheduling.css', '../shared/shared-styles.css']
})
export class AppointmentScheduling {
  appointments: Appointment[] = [];
  selectedAppointment: Appointment | null = null;
  successMessage: string = '';
  errorMessage: string = '';
  selectedSlot: string = '';
  selectedStartTime: string = '';
  selectedEndTime: string = '';
  selectedUpdateSlot: string = '';
  selectedUpdateStartTime: string = '';
  selectedUpdateEndTime: string = '';
  selectedCancelSlot: string = '';
  
  // Doctor and Specialisation data
  doctors: UserDTO[] = [];
  specialisations = ['Cardiology', 'Pediatrician', 'Neurologist', 'Orthologist'];
  selectedSpecialisation: string = '';
  selectedDoctor: UserDTO | null = null;
  availableSlots: string[] = [];
  selectedDate: string = '';
  selectedAppointmentForUpdate: Appointment | null = null;
  selectedAppointmentForCancel: Appointment | null = null;
  showUpdateForm: boolean = false;
  showCancelForm: boolean = false;
    updateFormData: any = {};
  cancelFormData: any = {};
  
  // Patient autofill data
  patientId: number = 0;
  patientName: string = '';
  patientEmail: string = '';
  userRole: string | null = null;
  
  // Loading states
  isBookingAppointment: boolean = false;
  isReschedulingAppointment: boolean = false;
  isCancellingAppointment: boolean = false;

  timeSlots = [
    { value: '09:00-10:00', label: '09:00 AM - 10:00 AM', startTime: '09:00', endTime: '10:00' },
    { value: '10:00-11:00', label: '10:00 AM - 11:00 AM', startTime: '10:00', endTime: '11:00' },
    { value: '11:00-12:00', label: '11:00 AM - 12:00 PM', startTime: '11:00', endTime: '12:00' },
    { value: '14:00-15:00', label: '02:00 PM - 03:00 PM', startTime: '14:00', endTime: '15:00' },
    { value: '15:00-16:00', label: '03:00 PM - 04:00 PM', startTime: '15:00', endTime: '16:00' },
    { value: '16:00-17:00', label: '04:00 PM - 05:00 PM', startTime: '16:00', endTime: '17:00' }
  ];
 
  constructor(private appointmentService: AppointmentService, private authService: AuthService) {
    this.loadPatientInfoFromToken();
    this.loadPatientAppointmentsOnLogin();
  }

  loadPatientInfoFromToken(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload); // Debug log
        
        this.userRole = payload.role || payload.user_type;
        
        // Only autofill if user is a patient
        if (this.userRole === 'PATIENT') {
          this.patientId = payload.id || payload.userId || 0;
          this.patientName = payload.name || payload.username || '';
          this.patientEmail = payload.sub || payload.email || '';
          console.log('Patient Info:', { id: this.patientId, name: this.patientName, email: this.patientEmail }); // Debug log
        }
      } catch (error) {
        console.error('Error parsing JWT token for patient info:', error);
      }
    }
  }

  loadPatientAppointmentsOnLogin(): void {
    // Use patient ID from token if available
    if (this.patientId > 0) {
      this.loadPatientAppointments(this.patientId);
    }
  }

  extractPatientIdFromToken(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || null;
    } catch (error) {
      return null;
    }
  }
 
  bookAppointment(request: AppointmentRequest): void {
    this.clearMessages();
    this.isBookingAppointment = true;
    
    this.appointmentService.bookAppointment(request).subscribe({
      next: (appointment) => {
        this.isBookingAppointment = false;
        alert('Appointment Booked Successfully! ID: ' + appointment.id);
        this.appointments.push(appointment);
      },
      error: (error) => {
        console.error('Full error details:', error);
        
        // Handle specific error cases with user-friendly messages
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.status === 400) {
          // Handle SlotAlreadyBookedException and other validation errors
          const errorMessage = error.error?.message || error.error || 'Invalid request data';
          if (errorMessage.includes('already booked') || errorMessage.includes('SlotAlreadyBooked')) {
            this.errorMessage = 'Sorry, this time slot has already been booked by another patient. Please select a different time slot.';
          } else if (errorMessage.includes('unavailable') || errorMessage.includes('DoctorUnavailable')) {
            this.errorMessage = 'The doctor is not available at the selected time. Please choose another time slot.';
          } else {
            this.errorMessage = errorMessage;
          }
        } else if (error.status === 404) {
          this.errorMessage = 'Service not available. Please try again later.';
        } else if (error.status === 409) {
          // Conflict - typically used for slot already booked
          this.errorMessage = 'This time slot is no longer available. Please select a different time slot.';
        } else if (error.status === 500) {
          // Check if it's a specific business logic error from backend
          const backendMessage = error.error?.message || error.error;
          if (backendMessage && typeof backendMessage === 'string') {
            if (backendMessage.includes('already booked') || backendMessage.includes('SlotAlreadyBooked')) {
              this.errorMessage = 'This time slot has already been taken by another patient. Please choose a different time slot.';
            } else if (backendMessage.includes('unavailable') || backendMessage.includes('DoctorUnavailable')) {
              this.errorMessage = 'The doctor is not available at this time. Please select another time slot.';
            } else if (backendMessage.includes('Read timed out') || backendMessage.includes('NOTIFICATION-SERVICE')) {
              this.errorMessage = 'Appointment booked successfully! Unable to send confirmation email due to network issues, but your appointment is saved in the database.';
            } else {
              this.errorMessage = backendMessage;
            }
          } else {
            this.errorMessage = 'Unable to process your appointment request. Please check your details and try again.';
          }
        } else {
          // Fallback to backend message if available
          const backendMessage = error.error?.message || error.error;
          if (backendMessage && typeof backendMessage === 'string') {
            if (backendMessage.includes('Read timed out') || backendMessage.includes('NOTIFICATION-SERVICE')) {
              this.errorMessage = 'Appointment booked successfully! Unable to send confirmation email due to network issues, but your appointment is saved in the database.';
            } else {
              this.errorMessage = backendMessage;
            }
          } else {
            this.errorMessage = 'Failed to book appointment. Please try again.';
          }
        }
        
        this.isBookingAppointment = false;
        
        // Scroll to show error message
        setTimeout(() => {
          const errorElement = document.querySelector('.alert-danger');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  }
 
  updateAppointment(id: number, request: AppointmentUpdateRequest): void {
    this.clearMessages();
    this.isReschedulingAppointment = true;
    
    this.appointmentService.updateAppointment(id, request).subscribe({
      next: (appointment) => {
        this.isReschedulingAppointment = false;
        alert('Appointment Rescheduled Successfully!');
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
          this.appointments[index] = appointment;
        }
      },
      error: (error) => {
        this.isReschedulingAppointment = false;
        const backendMessage = error.error?.message || error.error;
        if (backendMessage && typeof backendMessage === 'string' && 
            (backendMessage.includes('Read timed out') || backendMessage.includes('NOTIFICATION-SERVICE'))) {
          this.errorMessage = 'Appointment updated successfully! Unable to send confirmation email due to network issues, but your changes are saved in the database.';
        } else {
          this.errorMessage = 'Failed to update appointment. Please check the ID.';
        }
        console.error('Error updating appointment:', error);
      }
    });
  }
 
  cancelAppointment(id: number, cancelInfo: AppointmentCancelInfo): void {
    this.clearMessages();
    this.isCancellingAppointment = true;
    
    this.appointmentService.cancelAppointment(id, cancelInfo).subscribe({
      next: (response) => {
        this.isCancellingAppointment = false;
        alert('Appointment Cancelled Successfully!');
        this.appointments = this.appointments.filter(a => a.id !== id);
      },
      error: (error) => {
        console.error('Full cancel error details:', error);
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.status === 404) {
          this.errorMessage = 'Appointment not found. It may have already been cancelled.';
        } else if (error.status === 400) {
          const errorMessage = error.error?.message || error.error || 'Invalid request';
          this.errorMessage = errorMessage;
        } else if (error.status === 500) {
          // Check for specific backend error messages
          const backendMessage = error.error?.message || error.error;
          if (backendMessage && typeof backendMessage === 'string') {
            if (backendMessage.includes('Read timed out') || backendMessage.includes('NOTIFICATION-SERVICE')) {
              this.errorMessage = 'Appointment cancelled successfully! Unable to send confirmation email due to network issues, but your cancellation is saved in the database.';
            } else {
              this.errorMessage = backendMessage;
            }
          } else {
            this.errorMessage = 'Unable to cancel the appointment. Please try again or contact support.';
          }
        } else if (error.status === 200 || error.status === 204) {
          // Sometimes DELETE requests return 200/204 but Angular treats as error
          this.isCancellingAppointment = false;
          alert('Appointment Cancelled Successfully!');
          this.appointments = this.appointments.filter(a => a.id !== id);
        } else {
          // Use backend message if available
          const backendMessage = error.error?.message || error.error;
          if (backendMessage && typeof backendMessage === 'string') {
            if (backendMessage.includes('Read timed out') || backendMessage.includes('NOTIFICATION-SERVICE')) {
              this.errorMessage = 'Appointment cancelled successfully! Unable to send confirmation email due to network issues, but your cancellation is saved in the database.';
            } else {
              this.errorMessage = backendMessage;
            }
          } else {
            this.errorMessage = 'Failed to cancel appointment. Please try again.';
          }
        }
        
        this.isCancellingAppointment = false;
      }
    });
  }
 
  loadPatientAppointments(patientId: number): void {
    this.clearMessages();
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
      },
      error: (error) => {
        console.error('Full error details:', error);
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to backend. Check if backend is running on port 8082.';
        } else if (error.status === 404) {
          this.errorMessage = 'Patient not found or no appointments exist for this patient ID.';
        } else if (error.status === 500) {
          this.errorMessage = 'Backend server error: ' + (error.error?.message || 'Internal server error');
        } else {
          this.errorMessage = `Error ${error.status}: ${error.error?.message || 'Failed to load appointments'}`;
        }
      }
    });
  }
 
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
 
  onSlotChange(selectedSlot: string): void {
    console.log('Slot changed to:', selectedSlot); // Debug log
    if (selectedSlot && selectedSlot.includes('-')) {
      const [startTime, endTime] = selectedSlot.split('-');
      this.selectedStartTime = this.convertTo24Hour(startTime.trim());
      this.selectedEndTime = this.convertTo24Hour(endTime.trim());
      console.log('Set times:', { startTime: this.selectedStartTime, endTime: this.selectedEndTime }); // Debug log
    } else {
      // Use timeSlots array for proper time mapping
      const slot = this.timeSlots.find(s => s.value === selectedSlot);
      if (slot) {
        this.selectedStartTime = slot.startTime;
        this.selectedEndTime = slot.endTime;
        console.log('Set times from timeSlots:', { startTime: this.selectedStartTime, endTime: this.selectedEndTime }); // Debug log
      }
    }
  }

  convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
 
  onUpdateSlotChange(selectedSlot: string, form: any): void {
    const slot = this.timeSlots.find(s => s.value === selectedSlot);
    if (slot) {
      this.selectedUpdateStartTime = slot.startTime;
      this.selectedUpdateEndTime = slot.endTime;
    }
  }

  getAvailableUpdateSlots(): any[] {
    if (!this.selectedAppointmentForUpdate) {
      return this.timeSlots;
    }
    return this.timeSlots.filter(slot => slot.value !== this.selectedAppointmentForUpdate!.slot);
  }

  onCancelSlotChange(selectedSlot: string): void {
    const slot = this.timeSlots.find(s => s.value === selectedSlot);
    if (slot) {
      this.cancelFormData.startTime = slot.startTime;
      this.cancelFormData.endTime = slot.endTime;
    }
  }
 
  onBookAppointment(formData: any): void {
    console.log('Book form data:', formData); // Debug log
    console.log('Selected doctor:', this.selectedDoctor); // Debug log
    
    // Validate required fields
    if (!formData.patientId || !this.selectedDoctor || !formData.date || !formData.slot ||
        !formData.patientName || !formData.patientEmail ||
        !formData.startTime || !formData.endTime) {
      console.log('Validation failed:', {
        patientId: formData.patientId,
        selectedDoctor: this.selectedDoctor,
        date: formData.date,
        slot: formData.slot,
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      this.errorMessage = 'Please fill all required fields and select a doctor';
      return;
    }


 
    const request: AppointmentRequest = {
      patientId: Number(formData.patientId),
      doctorId: this.selectedDoctor.id,
      date: formData.date,
      slot: formData.slot,
      patientName: formData.patientName.trim(),
      patientEmail: formData.patientEmail.trim(),
      doctorName: this.selectedDoctor.name,
      startTime: formData.startTime,
      endTime: formData.endTime
    };
   
    // Add reason only if provided
    if (formData.reason && formData.reason.trim()) {
      request.reason = formData.reason.trim();
    }
   
    this.bookAppointment(request);
  }
 
  onUpdateAppointment(formData: any): void {
    console.log('Update form data:', formData); // Debug log
    console.log('Update form data object:', this.updateFormData); // Debug log
    
    if (!formData.id || !formData.newDate || !formData.newSlot || !formData.patientName ||
        !formData.patientEmail || !formData.doctorName || !formData.startTime ||
        !formData.endTime || !formData.reason) {
      console.log('Update validation failed:', {
        id: formData.id,
        newDate: formData.newDate,
        newSlot: formData.newSlot,
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        doctorName: formData.doctorName,
        startTime: formData.startTime,
        endTime: formData.endTime,
        reason: formData.reason
      });
      this.errorMessage = 'Please fill all required fields for update';
      return;
    }


 
    const request: AppointmentUpdateRequest = {
      appointmentId: Number(formData.id),
      newDate: formData.newDate,
      newSlot: formData.newSlot,
      patientName: formData.patientName.trim(),
      patientEmail: formData.patientEmail.trim(),
      doctorName: formData.doctorName.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      reason: formData.reason.trim()
    };
    this.updateAppointment(formData.id, request);
  }
 
  onCancelAppointment(formData: any): void {
    console.log('Cancel form data:', formData); // Debug log
    console.log('Cancel form data object:', this.cancelFormData); // Debug log
    
    if (!formData.patientName || !formData.doctorName || !formData.patientEmail ||
        !formData.date || !formData.startTime || !formData.endTime || !formData.reason) {
      console.log('Cancel validation failed:', {
        patientName: formData.patientName,
        doctorName: formData.doctorName,
        patientEmail: formData.patientEmail,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        reason: formData.reason
      });
      this.errorMessage = 'Please fill all required fields for cancellation';
      return;
    }


 
    const cancelInfo: AppointmentCancelInfo = {
      patientName: formData.patientName.trim(),
      doctorName: formData.doctorName.trim(),
      patientEmail: formData.patientEmail.trim(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      reason: formData.reason.trim()
    };
    this.cancelAppointment(formData.id, cancelInfo);
  }

  onSpecialisationChange(): void {
    if (this.selectedSpecialisation) {
      this.appointmentService.getDoctorsBySpecialisation(this.selectedSpecialisation).subscribe({
        next: (doctors) => {
          this.doctors = doctors;
          this.selectedDoctor = null;
          this.availableSlots = [];
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.doctors = [];
        }
      });
    } else {
      this.doctors = [];
      this.selectedDoctor = null;
      this.availableSlots = [];
    }
  }

  onDoctorChange(): void {
    this.availableSlots = [];
    if (this.selectedDoctor && this.selectedDate) {
      this.loadAvailableSlots();
    }
  }

  onDateChange(): void {
    this.availableSlots = [];
    // Add validation to prevent invalid dates
    if (this.selectedDoctor && this.selectedDate && this.selectedDate.length === 10) {
      this.loadAvailableSlots();
    }
  }

  loadAvailableSlots(): void {
    if (this.selectedDoctor && this.selectedDate) {
      // Validate and format date
      const formattedDate = this.formatDate(this.selectedDate);
      if (!formattedDate || formattedDate.length !== 10) {
        console.error('Invalid date format:', this.selectedDate);
        return;
      }
      
      this.appointmentService.getAvailableSlots(this.selectedDoctor.id, formattedDate).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
        },
        error: (error) => {
          console.error('Error loading available slots:', error);
          this.availableSlots = [];
          this.errorMessage = 'Doctor is not available on selected date';
        }
      });
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    // Handle already formatted dates
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  selectAppointmentForUpdate(appointment: Appointment): void {
    this.selectedAppointmentForUpdate = appointment;
    this.showUpdateForm = true;
    this.showCancelForm = false;
    this.clearMessages();
    
    // Set current slot and times from appointment
    this.selectedUpdateSlot = appointment.slot;
    const slot = this.timeSlots.find(s => s.value === appointment.slot);
    if (slot) {
      this.selectedUpdateStartTime = slot.startTime;
      this.selectedUpdateEndTime = slot.endTime;
    }
    
    // Fetch and populate form data
    this.updateFormData = {
      id: appointment.id,
      newDate: appointment.date,
      newSlot: appointment.slot, // Set the current slot as default
      patientName: 'Loading...',
      patientEmail: 'Loading...',
      doctorName: 'Loading...'
    };
    
    this.fetchPatientAndDoctorDetails(appointment.patientId, appointment.doctorId, 'update');
    
    // Scroll to update form
    setTimeout(() => {
      document.getElementById('update-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  selectAppointmentForCancel(appointment: Appointment): void {
    this.selectedAppointmentForCancel = appointment;
    this.showCancelForm = true;
    this.showUpdateForm = false;
    this.clearMessages();
    
    // Set times from appointment slot and auto-select the slot
    const slot = this.timeSlots.find(s => s.value === appointment.slot);
    let startTime = '', endTime = '';
    if (slot) {
      startTime = slot.startTime;
      endTime = slot.endTime;
      this.selectedCancelSlot = appointment.slot; // Auto-select the time slot
    }
    
    // Fetch and populate form data
    this.cancelFormData = {
      id: appointment.id,
      date: appointment.date,
      slot: appointment.slot, // Set the current slot
      startTime: startTime,
      endTime: endTime,
      patientName: 'Loading...',
      patientEmail: 'Loading...',
      doctorName: 'Loading...'
    };
    
    this.fetchPatientAndDoctorDetails(appointment.patientId, appointment.doctorId, 'cancel');
    
    // Scroll to cancel form
    setTimeout(() => {
      document.getElementById('cancel-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  fetchPatientAndDoctorDetails(patientId: number, doctorId: number, formType: 'update' | 'cancel'): void {
    // Use patient details from token
    const patientName = this.patientName || 'Patient';
    const patientEmail = this.patientEmail || '';
    
    console.log('Fetching details for form:', formType, { patientName, patientEmail }); // Debug log
    
    // Fetch doctor name from backend
    this.appointmentService.getUserById(doctorId).subscribe({
      next: (doctor) => {
        const doctorName = doctor.name || `Doctor ${doctorId}`;
        
        if (formType === 'update') {
          this.updateFormData.patientName = patientName;
          this.updateFormData.patientEmail = patientEmail;
          this.updateFormData.doctorName = doctorName;
          console.log('Update form data set:', this.updateFormData); // Debug log
        } else {
          this.cancelFormData.patientName = patientName;
          this.cancelFormData.patientEmail = patientEmail;
          this.cancelFormData.doctorName = doctorName;
        }
      },
      error: (error) => {
        console.error('Error fetching doctor details:', error);
        const fallbackDoctorName = `Doctor ${doctorId}`;
        
        if (formType === 'update') {
          this.updateFormData.patientName = patientName;
          this.updateFormData.patientEmail = patientEmail;
          this.updateFormData.doctorName = fallbackDoctorName;
        } else {
          this.cancelFormData.patientName = patientName;
          this.cancelFormData.patientEmail = patientEmail;
          this.cancelFormData.doctorName = fallbackDoctorName;
        }
      }
    });
  }

  showSuccessPopup(title: string, message: string): void {
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
      <div class="popup-content">
        <div class="popup-icon">✓</div>
        <h4>${title}</h4>
        <p>${message}</p>
        <button class="popup-btn" onclick="document.querySelector('.success-popup').remove()">OK</button>
      </div>
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => {
      const existingPopup = document.querySelector('.success-popup');
      if (existingPopup) {
        existingPopup.remove();
      }
    }, 4000);
  }
}
 
 
 