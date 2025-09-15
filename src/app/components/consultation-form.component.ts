import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultationService, Consultation } from '../services/consultation.service';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.css']
})
export class ConsultationFormComponent implements OnInit {
  @Input() doctorID: number | null = null;
  @Input() selectedDate: string = '';
  @Input() selectedTimeSlot: string = '';
  @Output() consultationCreated = new EventEmitter<void>();
  @Output() closeForm = new EventEmitter<void>();

  patientID: number | null = null;
  notes = '';
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(private consultationService: ConsultationService) {}

  ngOnInit() {
    // Pre-fill current date if not provided
    if (!this.selectedDate) {
      this.selectedDate = new Date().toISOString().split('T')[0];
    }
  }

  onSubmit() {
    if (!this.doctorID || !this.patientID || !this.selectedDate || !this.selectedTimeSlot) {
      this.showMessage('Please fill in all required fields', 'error');
      return;
    }

    this.isSubmitting = true;
    const consultation: Consultation = {
      doctorID: this.doctorID,
      patientID: this.patientID,
      date: this.selectedDate,
      timeSlot: this.selectedTimeSlot,
      notes: this.notes,
      status: 'SCHEDULED'
    };

    this.consultationService.createConsultation(consultation).subscribe({
      next: () => {
        this.showMessage('Consultation scheduled successfully!', 'success');
        this.consultationCreated.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: () => {
        this.showMessage('Error scheduling consultation', 'error');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  close() {
    this.closeForm.emit();
    this.resetForm();
  }

  private resetForm() {
    this.patientID = null;
    this.notes = '';
    this.message = '';
    this.messageType = '';
  }

  private showMessage(text: string, type: 'success' | 'error') {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 3000);
  }
}