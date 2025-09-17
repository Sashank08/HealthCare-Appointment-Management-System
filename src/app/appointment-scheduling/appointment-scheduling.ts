import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentService, Appointment, AppointmentRequest, AppointmentUpdateRequest, AppointmentCancelInfo, UserDTO } from './appointment.service';
 
@Component({
  selector: 'app-appointment-scheduling',
  imports: [FormsModule, CommonModule],
  templateUrl: './appointment-scheduling.html',
  styleUrl: './appointment-scheduling.css'
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
  
  // Doctor and Specialisation data
  doctors: UserDTO[] = [];
  specialisations = ['Cardiology', 'Pediatrician', 'Neurologist', 'Orthologist'];
  selectedSpecialisation: string = '';
  selectedDoctor: UserDTO | null = null;
  availableSlots: string[] = [];
  selectedDate: string = '';
 
  timeSlots = [
    { value: '09:00-10:00', label: '09:00 AM - 10:00 AM', startTime: '09:00', endTime: '10:00' },
    { value: '10:00-11:00', label: '10:00 AM - 11:00 AM', startTime: '10:00', endTime: '11:00' },
    { value: '11:00-12:00', label: '11:00 AM - 12:00 PM', startTime: '11:00', endTime: '12:00' },
    { value: '14:00-15:00', label: '02:00 PM - 03:00 PM', startTime: '14:00', endTime: '15:00' },
    { value: '15:00-16:00', label: '03:00 PM - 04:00 PM', startTime: '15:00', endTime: '16:00' },
    { value: '16:00-17:00', label: '04:00 PM - 05:00 PM', startTime: '16:00', endTime: '17:00' }
  ];
 
  constructor(private appointmentService: AppointmentService) {}
 
  bookAppointment(request: AppointmentRequest): void {
    this.clearMessages();
    this.appointmentService.bookAppointment(request).subscribe({
      next: (appointment) => {
        this.successMessage = `Appointment booked successfully! ID: ${appointment.id}`;
        this.appointments.push(appointment);
      },
      error: (error) => {
        console.error('Full error details:', error);
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to backend. Check if backend is running on port 8082.';
        } else if (error.status === 404) {
          this.errorMessage = 'Backend endpoint not found. Check URL.';
        } else if (error.status === 500) {
          this.errorMessage = 'Backend server error: ' + (error.error?.message || 'Internal server error');
        } else {
          this.errorMessage = `Error ${error.status}: ${error.error?.message || 'Failed to book appointment'}`;
        }
      }
    });
  }
 
  updateAppointment(id: number, request: AppointmentUpdateRequest): void {
    this.clearMessages();
    this.appointmentService.updateAppointment(id, request).subscribe({
      next: (appointment) => {
        this.successMessage = `Appointment updated successfully!`;
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
          this.appointments[index] = appointment;
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to update appointment. Please check the ID.';
        console.error('Error updating appointment:', error);
      }
    });
  }
 
  cancelAppointment(id: number, cancelInfo: AppointmentCancelInfo): void {
    this.clearMessages();
    console.log('Cancelling appointment ID:', id, 'with info:', cancelInfo);
    this.appointmentService.cancelAppointment(id, cancelInfo).subscribe({
      next: (response) => {
        console.log('Cancel response:', response);
        this.successMessage = 'Appointment cancelled successfully!';
        this.appointments = this.appointments.filter(a => a.id !== id);
      },
      error: (error) => {
        console.error('Full cancel error details:', error);
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to backend. Check if backend is running on port 8082.';
        } else if (error.status === 404) {
          this.errorMessage = 'Appointment not found with the provided ID.';
        } else if (error.status === 500) {
          this.errorMessage = 'Backend server error: ' + (error.error?.message || 'Internal server error');
        } else if (error.status === 200 || error.status === 204) {
          // Sometimes DELETE requests return 200/204 but Angular treats as error
          this.successMessage = 'Appointment cancelled successfully!';
          this.appointments = this.appointments.filter(a => a.id !== id);
        } else {
          this.errorMessage = `Error ${error.status}: ${error.error?.message || 'Failed to cancel appointment'}`;
        }
      }
    });
  }
 
  loadPatientAppointments(patientId: number): void {
    this.clearMessages();
    console.log('Loading appointments for patient ID:', patientId);
    this.appointmentService.getAppointmentsByPatient(patientId).subscribe({
      next: (appointments) => {
        console.log('Received appointments:', appointments);
        this.appointments = appointments;
        this.successMessage = `Loaded ${appointments.length} appointments`;
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
    if (selectedSlot && selectedSlot.includes('-')) {
      const [startTime, endTime] = selectedSlot.split('-');
      this.selectedStartTime = startTime.trim();
      this.selectedEndTime = endTime.trim();
    }
  }
 
  onUpdateSlotChange(selectedSlot: string, form: any): void {
    const slot = this.timeSlots.find(s => s.value === selectedSlot);
    if (slot) {
      this.selectedUpdateStartTime = slot.startTime;
      this.selectedUpdateEndTime = slot.endTime;
    }
  }
 
  onBookAppointment(formData: any): void {
    // Validate required fields
    if (!formData.patientId || !this.selectedDoctor || !formData.date || !formData.slot ||
        !formData.patientName || !formData.patientEmail ||
        !formData.startTime || !formData.endTime) {
      this.errorMessage = 'Please fill all required fields and select a doctor';
      return;
    }

    if (!confirm('Are you sure you want to book this appointment?')) {
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
   
    console.log('Sending request:', request);
    this.bookAppointment(request);
  }
 
  onUpdateAppointment(formData: any): void {
    if (!formData.id || !formData.newDate || !formData.newSlot || !formData.patientName ||
        !formData.patientEmail || !formData.doctorName || !formData.startTime ||
        !formData.endTime || !formData.reason) {
      this.errorMessage = 'Please fill all required fields for update';
      return;
    }

    if (!confirm('Are you sure you want to update this appointment?')) {
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
    if (!formData.patientName || !formData.doctorName || !formData.patientEmail ||
        !formData.date || !formData.startTime || !formData.endTime || !formData.reason) {
      this.errorMessage = 'Please fill all required fields for cancellation';
      return;
    }

    if (!confirm('Are you sure you want to cancel this appointment?')) {
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
    if (this.selectedDoctor && this.selectedDate) {
      this.loadAvailableSlots();
    }
  }

  loadAvailableSlots(): void {
    if (this.selectedDoctor && this.selectedDate) {
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = this.formatDate(this.selectedDate);
      this.appointmentService.getAvailableSlots(this.selectedDoctor.id, formattedDate).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
        },
        error: (error) => {
          console.error('Error loading available slots:', error);
          this.availableSlots = [];
        }
      });
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
 
 
 