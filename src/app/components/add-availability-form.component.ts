import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService, Availability } from '../services/availability.service';

@Component({
  selector: 'app-add-availability-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-availability-form.component.html',
  styleUrls: ['./add-availability-form.component.css']
})
export class AddAvailabilityFormComponent implements OnInit {
  @Output() availabilityAdded = new EventEmitter<void>();

  doctorID: number | null = null;
  date = '';
  selectedTimeSlots: string[] = [];
  availableTimeSlots: string[] = [];
  isSubmitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  ngOnInit() {
    this.generateTimeSlots();
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

  constructor(private availabilityService: AvailabilityService) {}

  onSubmit() {
    if (!this.doctorID || !this.date || this.selectedTimeSlots.length === 0) {
      this.showMessage('Please fill in all fields and select time slots', 'error');
      return;
    }

    this.isSubmitting = true;
    const availability: Availability = {
      doctorID: this.doctorID!,
      date: this.date,
      timeSlots: this.selectedTimeSlots
    };

    this.availabilityService.addAvailability(availability).subscribe({
      next: () => {
        this.showMessage('Availability added successfully!', 'success');
        this.resetForm();
        this.availabilityAdded.emit();
      },
      error: () => {
        this.showMessage('Error adding availability', 'error');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  private resetForm() {
    this.doctorID = null;
    this.date = '';
    this.selectedTimeSlots = [];
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