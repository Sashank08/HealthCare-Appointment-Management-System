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

  // Form and data properties
  consultationForm: FormGroup;
  consultations: Consultation[] = [];
  selectedPatientId: number | null = null;
  
  // UI state properties
  errorMessage = '';
  successMessage = '';
  showAddForm = false;
  
  // Loading states
  isLoading = false;
  isSubmitting = false;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    console.log('Consultation Records Component initialized');
    this.setupFormValidation();
    this.subscribeToLoadingStates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to loading states from service
   */
  private subscribeToLoadingStates(): void {
    this.consultationService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    this.consultationService.submitting$
      .pipe(takeUntil(this.destroy$))
      .subscribe(submitting => {
        this.isSubmitting = submitting;
      });
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.consultationForm = this.formBuilder.group({
      notes: ['', [
        Validators.required, 
        Validators.minLength(1),
        Validators.maxLength(1000)
      ]],
      prescription: ['', [
        Validators.required, 
        Validators.minLength(1),
        Validators.maxLength(1000)
      ]],
      appointmentId: ['', [
        Validators.required, 
        Validators.min(1),
        Validators.pattern(/^\d+$/)
      ]],
      patientId: ['', [
        Validators.required, 
        Validators.min(1),
        Validators.pattern(/^\d+$/)
      ]]
    });
  }

  /**
   * Setup form validation
   */
  private setupFormValidation(): void {
    this.consultationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.errorMessage || this.successMessage) {
          this.clearMessages();
        }
      });
  }

  /**
   * Save consultation - RESTORED FUNCTIONALITY
   */
  saveConsultation(): void {
    if (this.consultationForm.valid) {
      this.clearMessages();
      const consultation: Consultation = this.consultationForm.value;

      const validation = this.consultationService.validateConsultation(consultation);
      if (!validation.isValid) {
        this.errorMessage = validation.errors.join(', ');
        return;
      }

      this.consultationService.saveConsultation(consultation)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = response;
            this.consultationForm.reset();
            this.showAddForm = false;
            
            // Refresh medical history if viewing the same patient
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

  /**
   * Handle search button click
   */
  onSearchClick(patientIdValue: string): void {
    console.log('Search button clicked with value:', patientIdValue);
    
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

  /**
   * View medical history - FIXED TO DISPLAY IN UI
   */
  viewMedicalHistory(patientId: number, forceRefresh: boolean = false): void {
    console.log('viewMedicalHistory called with patientId:', patientId);
    
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
          console.log('Medical history received:', consultations);
          // THIS IS THE KEY FIX - PROPERLY SET THE COMPONENT PROPERTY
          this.consultations = consultations;
          
          if (consultations.length === 0) {
            this.errorMessage = `No consultation records found for Patient ID: ${patientId}`;
          } else {
            this.successMessage = `Found ${consultations.length} consultation record(s) for Patient ID: ${patientId}`;
          }
        },
        error: (error) => {
          console.error('Error fetching medical history:', error);
          this.errorMessage = error.message;
          this.consultations = []; // Clear previous results on error
        }
      });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.saveConsultation();
  }

  /**
   * Toggle add form visibility
   */
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.consultationForm.reset();
      this.clearMessages();
    }
  }

  /**
   * Refresh medical history for current patient
   */
  refreshMedicalHistory(): void {
    if (this.selectedPatientId) {
      this.viewMedicalHistory(this.selectedPatientId, true);
    }
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByConsultationId(index: number, consultation: Consultation): number {
    return consultation.consultationId || index;
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.consultationForm.controls).forEach(key => {
      this.consultationForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Getter for form controls
   */
  get f() {
    return this.consultationForm.controls;
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.consultationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.consultationForm.get(fieldName);
    if (field?.errors) {
      const fieldDisplayName = fieldName.charAt(0).toUpperCase() + 
        fieldName.slice(1).replace(/([A-Z])/g, ' $1');
      
      if (field.errors['required']) {
        return `${fieldDisplayName} is required`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${fieldDisplayName} must be at least ${requiredLength} character(s)`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${fieldDisplayName} cannot exceed ${maxLength} characters`;
      }
      if (field.errors['min']) {
        return `${fieldDisplayName} must be a positive number`;
      }
      if (field.errors['pattern']) {
        return `${fieldDisplayName} must be a valid positive number`;
      }
    }
    return '';
  }
}