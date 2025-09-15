import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService, Availability } from '../services/availability.service';
import { AddAvailabilityFormComponent } from './add-availability-form.component';
import { UpdateAvailabilityFormComponent } from './update-availability-form.component';

@Component({
  selector: 'app-availability-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AddAvailabilityFormComponent, UpdateAvailabilityFormComponent],
  templateUrl: './availability-dashboard.component.html',
  styleUrls: ['./availability-dashboard.component.css']
})
export class AvailabilityDashboardComponent implements OnInit {
  searchDoctorID: number | null = null;
  startDate = '';
  endDate = '';
  availabilities: Availability[] = [];
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  selectedAvailability: Availability | null = null;
  showUpdateModal = false;

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit() {}

  searchAvailability() {
    if (!this.searchDoctorID || !this.startDate || !this.endDate) {
      this.showMessage('Please enter Doctor ID and date range', 'error');
      return;
    }

    this.isLoading = true;
    this.availabilityService.getAvailabilityByDoctor(this.searchDoctorID, this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.availabilities = data || [];
        if (!data || data.length === 0) {
          this.showMessage('No availability found for this doctor', 'error');
        }
      },
      error: () => {
        this.showMessage('Error fetching availability data', 'error');
        this.availabilities = [];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  deleteAvailability(doctorID: number, date: string) {
    if (confirm('Are you sure you want to delete this availability?')) {
      this.availabilityService.deleteAvailability(doctorID, date).subscribe({
        next: () => {
          this.availabilities = this.availabilities.filter(
            a => !(a.doctorID === doctorID && a.date === date)
          );
          this.showMessage('Availability deleted successfully', 'success');
        },
        error: () => {
          this.showMessage('Error deleting availability', 'error');
        }
      });
    }
  }

  openUpdateModal(availability: Availability) {
    this.selectedAvailability = availability;
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.selectedAvailability = null;
  }

  onAvailabilityUpdated() {
    this.closeUpdateModal();
    if (this.searchDoctorID && this.startDate && this.endDate) {
      this.searchAvailability();
    }
  }

  onAvailabilityAdded() {
    if (this.searchDoctorID && this.startDate && this.endDate) {
      this.searchAvailability();
    }
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