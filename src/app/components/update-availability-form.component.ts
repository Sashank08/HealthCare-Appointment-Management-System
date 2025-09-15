import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService, Availability } from '../services/availability.service';

@Component({
  selector: 'app-update-availability-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-availability-form.component.html',
  styleUrls: ['./update-availability-form.component.css']
})
export class UpdateAvailabilityFormComponent implements OnInit, OnChanges {
  @Input() availability: Availability | null = null;
  @Input() isVisible = false;
  @Output() availabilityUpdated = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  originalDoctorID = 0;
  originalDate = '';
  doctorID: number | null = null;
  date = '';
  selectedTimeSlots: string[] = [];
  availableTimeSlots: string[] = [];
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit() {
    this.generateTimeSlots();
  }

  ngOnChanges() {
    if (this.availability) {
      this.originalDoctorID = this.availability.doctorID;
      this.originalDate = this.availability.date;
      this.doctorID = this.availability.doctorID;
      this.date = this.availability.date;
      this.selectedTimeSlots = this.availability.timeSlots ? [...this.availability.timeSlots] : [];
    } else {
      this.selectedTimeSlots = [];
    }
  }

  generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const startTime = this.formatTime(hour, 0);
      const endTime = this.formatTime(hour + 1, 0);
      slots.push(`${startTime} - ${endTime}`);
    }
    this.availableTimeSlots = slots;
  }

  formatTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  }

  toggleTimeSlot(slot: string) {
    const index = this.selectedTimeSlots.indexOf(slot);
    if (index > -1) {
      this.selectedTimeSlots.splice(index, 1);
    } else {
      this.selectedTimeSlots.push(slot);
    }
  }

  isSlotSelected(slot: string): boolean {
    return this.selectedTimeSlots.includes(slot);
  }

  onSubmit() {
    if (!this.doctorID || !this.date || !this.selectedTimeSlots || this.selectedTimeSlots.length === 0) {
      this.showMessage('Please fill in all fields and select time slots', 'error');
      return;
    }

    this.isSubmitting = true;
    const updatedAvailability: Availability = {
      doctorID: this.doctorID,
      date: this.date,
      timeSlots: this.selectedTimeSlots
    };

    // Always delete old and create new to handle composite key changes
    this.availabilityService.deleteAvailability(this.originalDoctorID, this.originalDate).subscribe({
      next: () => {
        this.availabilityService.addAvailability(updatedAvailability).subscribe({
          next: () => {
            this.showMessage('Availability updated successfully!', 'success');
            this.availabilityUpdated.emit();
            setTimeout(() => this.close(), 1500);
          },
          error: () => {
            this.showMessage('Error updating availability', 'error');
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      },
      error: () => {
        this.showMessage('Error updating availability', 'error');
        this.isSubmitting = false;
      }
    });
  }

  close() {
    this.closeModal.emit();
    this.resetForm();
  }

  private resetForm() {
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