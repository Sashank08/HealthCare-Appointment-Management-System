import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ConsultationRecordsService, Consultation } from '../services/consultation-records';

@Component({
  selector: 'app-consultation-records',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultation-records.html',
  styleUrls: ['./consultation-records.css']
})
export class ConsultationRecordsComponent implements OnInit, OnDestroy {
  private consultationService = inject(ConsultationRecordsService);
  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  consultationForm: FormGroup;
  upcomingAppointmentForm: FormGroup;
  patientByPhoneForm: FormGroup;
  
  consultations: Consultation[] = [];
  selectedPatientId: number | null = null;
  upcomingAppointmentId: number | null = null;
  patientIdFromPhone: number | null = null;
  
  errorMessage = '';
  successMessage = '';
  upcomingAppointmentError = '';
  upcomingAppointmentSuccess = '';
  patientByPhoneError = '';
  patientByPhoneSuccess = '';
  
  showAddForm = false;
  isLoading = false;
  isSubmitting = false;
  isLoadingUpcomingAppointment = false;
  isLoadingPatientByPhone = false;

  ngOnInit(): void {
    this.consultationForm = this.formBuilder.group({
      notes: ['', [Validators.required, Validators.maxLength(1000)]],
      prescription: ['', [Validators.required, Validators.maxLength(1000)]],
      appointmentId: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      patientId: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]]
    });

    this.upcomingAppointmentForm = this.formBuilder.group({
      patientId: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      date: ['', [Validators.required]]
    });

    this.patientByPhoneForm = this.formBuilder.group({
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]]
    });

    this.consultationService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);

    this.consultationService.submitting$
      .pipe(takeUntil(this.destroy$))
      .subscribe(submitting => this.isSubmitting = submitting);

    this.consultationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.clearMessages());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveConsultation(): void {
    if (this.consultationForm.valid) {
      this.clearMessages();
      const consultation: Consultation = this.consultationForm.value;

      this.consultationService.saveConsultation(consultation)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = response;
            this.consultationForm.reset();
            this.showAddForm = false;
            
            if (this.selectedPatientId === consultation.patientId) {
              this.refreshMedicalHistory();
            }
          },
          error: (error) => {
            this.errorMessage = error.message;
          }
        });
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  onSearchClick(patientIdValue: string): void {
    this.clearMessages();
    
    if (!patientIdValue || patientIdValue.trim() === '') {
      this.errorMessage = 'Please enter a Patient ID';
      return;
    }
    
    const patientId = parseInt(patientIdValue.trim(), 10);
    
    if (isNaN(patientId) || patientId <= 0) {
      this.errorMessage = 'Please enter a valid positive number for Patient ID';
      return;
    }
    
    this.viewMedicalHistory(patientId, false);
  }

  viewMedicalHistory(patientId: number, forceRefresh: boolean = false): void {
    if (!patientId || patientId <= 0) {
      this.errorMessage = 'Please enter a valid Patient ID (positive number)';
      return;
    }

    this.clearMessages();
    this.selectedPatientId = patientId;

    this.consultationService.getMedicalHistory(patientId, forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (consultations) => {
          this.consultations = consultations;
          
          if (consultations.length === 0) {
            this.errorMessage = `No consultation records found for Patient ID: ${patientId}`;
          } else {
            this.successMessage = `Found ${consultations.length} consultation record(s) for Patient ID: ${patientId}`;
          }
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.consultations = []; 
        }
      });
  }

  onSubmit(): void {
    this.saveConsultation();
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.consultationForm.reset();
      this.clearMessages();
    }
  }

  refreshMedicalHistory(): void {
    if (this.selectedPatientId) {
      this.viewMedicalHistory(this.selectedPatientId, true);
    }
  }

  getUpcomingAppointment(): void {
    if (this.upcomingAppointmentForm.valid) {
      this.clearUpcomingAppointmentMessages();
      this.isLoadingUpcomingAppointment = true;
      
      const { patientId, date } = this.upcomingAppointmentForm.value;
      
      this.consultationService.getUpcomingAppointmentId(patientId, date)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (appointmentId) => {
            this.upcomingAppointmentId = appointmentId;
            this.upcomingAppointmentSuccess = `Upcoming appointment ID: ${appointmentId}`;
            this.isLoadingUpcomingAppointment = false;
          },
          error: (error) => {
            this.upcomingAppointmentError = error.message;
            this.upcomingAppointmentId = null;
            this.isLoadingUpcomingAppointment = false;
          }
        });
    } else {
      this.markFormGroupTouchedByName('upcomingAppointmentForm');
      this.upcomingAppointmentError = 'Please fill in all required fields correctly.';
    }
  }

  getPatientByPhone(): void {
    if (this.patientByPhoneForm.valid) {
      this.clearPatientByPhoneMessages();
      this.isLoadingPatientByPhone = true;
      
      const { phone } = this.patientByPhoneForm.value;
      
      this.consultationService.getPatientByPhone(phone)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (patientId) => {
            this.patientIdFromPhone = patientId;
            this.patientByPhoneSuccess = `Patient ID: ${patientId}`;
            this.isLoadingPatientByPhone = false;
          },
          error: (error) => {
            this.patientByPhoneError = error.message;
            this.patientIdFromPhone = null;
            this.isLoadingPatientByPhone = false;
          }
        });
    } else {
      this.markFormGroupTouchedByName('patientByPhoneForm');
      this.patientByPhoneError = 'Please enter a valid phone number (10-15 digits).';
    }
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  clearUpcomingAppointmentMessages(): void {
    this.upcomingAppointmentError = '';
    this.upcomingAppointmentSuccess = '';
  }

  clearPatientByPhoneMessages(): void {
    this.patientByPhoneError = '';
    this.patientByPhoneSuccess = '';
  }

  trackByConsultationId(index: number, consultation: Consultation): number {
    return consultation.consultationId || index;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.consultationForm.controls).forEach(key => {
      this.consultationForm.get(key)?.markAsTouched();
    });
  }

  private markFormGroupTouchedByName(formName: string): void {
    let targetForm: FormGroup;
    
    switch(formName) {
      case 'upcomingAppointmentForm':
        targetForm = this.upcomingAppointmentForm;
        break;
      case 'patientByPhoneForm':
        targetForm = this.patientByPhoneForm;
        break;
      default:
        targetForm = this.consultationForm;
    }
    
    Object.keys(targetForm.controls).forEach(key => {
      targetForm.get(key)?.markAsTouched();
    });
  }

  get f() {
    return this.consultationForm.controls;
  }

  get upcomingF() {
    return this.upcomingAppointmentForm.controls;
  }

  get phoneF() {
    return this.patientByPhoneForm.controls;
  }

  hasError(fieldName: string): boolean {
    const field = this.consultationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  hasUpcomingError(fieldName: string): boolean {
    const field = this.upcomingAppointmentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  hasPhoneError(fieldName: string): boolean {
    const field = this.patientByPhoneForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.consultationForm.get(fieldName);
    if (!field?.errors) { return ''; }

    const displayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

    if (field.errors['required']) {
      return `${displayName} is required.`;
    }
    if (field.errors['minlength']) {
        const { requiredLength } = field.errors['minlength'];
        return `${displayName} must be at least ${requiredLength} characters.`;
    }
    if (field.errors['maxlength']) {
      const { requiredLength } = field.errors['maxlength'];
      return `${displayName} cannot exceed ${requiredLength} characters.`;
    }
    if (field.errors['min']) {
      return `${displayName} must be a positive number.`;
    }
    if (field.errors['pattern']) {
      return `Please enter a valid number for ${displayName}.`;
    }
    
    return '';
  }
}