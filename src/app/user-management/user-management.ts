import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent {
  currentView = 'login';
  userName = 'John Doe';
  registrationSuccess = false;
  userRole: string | null = null;
  
  // Validation properties
  loginData = {
    email: '',
    password: ''
  };
  
  validationErrors = {
    registration: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      password: ''
    },
    login: {
      email: '',
      password: ''
    },
    doctorLogin: {
      email: '',
      password: ''
    }
  };

  constructor(private authService: AuthService) {}
  
  registrationData = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: ''
  };

  doctorLoginData = {
    email: '',
    password: ''
  };

  showLogin() {
    this.currentView = 'login';
    this.registrationSuccess = false;
  }

  showRegister() {
    this.currentView = 'register';
    this.registrationSuccess = false;
  }

  showAbout() {
    this.currentView = 'about';
    this.scrollToAbout();
  }

  showCardiology() {
    this.currentView = 'cardiology';
    this.scrollToCardiology();
  }

  showNeurology() {
    this.currentView = 'neurology';
    this.scrollToNeurology();
  }

  showOrthopedics() {
    this.currentView = 'orthopedics';
    this.scrollToOrthopedics();
  }

  showPediatrics() {
    this.currentView = 'pediatrics';
    this.scrollToPediatrics();
  }

  showDoctorLogin() {
    this.currentView = 'doctor-login';
    this.scrollToDoctorLogin();
  }

  doctorLogin() {
    this.clearValidationErrors('doctorLogin');
    
    if (this.validateDoctorLogin()) {
      this.authService.login(this.doctorLoginData.email, this.doctorLoginData.password).subscribe({
        next: (token) => {
          this.authService.saveToken(token);
          this.userRole = this.authService.extractRoleFromToken(token);
          if (this.canAccessDoctorDashboard()) {
            this.currentView = 'doctor-dashboard';
            this.scrollToDoctorDashboard();
          }
        },
        error: (error) => {
          alert('Doctor login failed: ' + error.message);
        }
      });
    }
  }

  showUpcomingAppointments() {
    alert('Upcoming Appointments - Feature coming soon!');
  }

  showCreateConsultation() {
    alert('Create Consultation - Feature coming soon!');
  }

  showCreateAvailability() {
    alert('Create Availability - Feature coming soon!');
  }

  register() {
    this.clearValidationErrors('registration');
    
    if (this.validateRegistration()) {
      // Temporary mock registration for frontend testing
      console.log('Mock registration for:', this.registrationData);
      
      // Simulate successful registration
      this.userName = this.registrationData.fullName;
      this.registrationSuccess = true;
      
      // Create mock token for testing
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUEFUSUVOVCIsInVzZXJFbWFpbCI6IicgKyB0aGlzLnJlZ2lzdHJhdGlvbkRhdGEuZW1haWwgKyAnIn0.mock';
      this.authService.saveToken(mockToken);
      
      setTimeout(() => {
        this.currentView = 'dashboard';
        this.scrollToDashboard();
      }, 2000);
      
      // Uncomment below when backend is ready
      /*
      const userData = {
        fullName: this.registrationData.fullName,
        userEmail: this.registrationData.email,
        phoneNumber: this.registrationData.phone,
        dateOfBirth: this.registrationData.dateOfBirth,
        password: this.registrationData.password,
        role: 'PATIENT'
      };
      
      this.authService.register(userData).subscribe({
        next: (response) => {
          this.userName = this.registrationData.fullName;
          this.registrationSuccess = true;
          
          setTimeout(() => {
            this.currentView = 'dashboard';
            this.scrollToDashboard();
          }, 2000);
        },
        error: (error) => {
          console.error('Registration error details:', error);
          alert('Registration failed: ' + error.message);
        }
      });
      */
    }
  }

  login() {
    this.clearValidationErrors('login');
    
    if (this.validateLogin()) {
      // Temporary mock login for frontend testing
      console.log('Mock login for:', this.loginData.email);
      
      // Create mock token
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUEFUSUVOVCIsInVzZXJFbWFpbCI6IicgKyB0aGlzLmxvZ2luRGF0YS5lbWFpbCArICcifQ.mock';
      this.authService.saveToken(mockToken);
      this.userRole = 'PATIENT';
      this.userName = 'Test Patient';
      
      this.currentView = 'dashboard';
      this.scrollToDashboard();
      
      // Uncomment below when backend is ready
      /*
      this.authService.login(this.loginData.email, this.loginData.password).subscribe({
        next: (token) => {
          this.authService.saveToken(token);
          this.userRole = this.authService.extractRoleFromToken(token);
          if (this.canAccessPatientDashboard()) {
            this.currentView = 'dashboard';
            this.scrollToDashboard();
          }
        },
        error: (error) => {
          alert('Login failed: ' + error.message);
        }
      });
      */
    }
  }

  showHome() {
    this.currentView = 'login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showAppointmentHistory() {
    alert('Appointment History - Feature coming soon!');
  }

  showMedicalHistory() {
    alert('Medical History - Feature coming soon!');
  }

  logout() {
    this.currentView = 'login';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToLogin() {
    setTimeout(() => {
      const element = document.getElementById('user-management');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToDashboard() {
    setTimeout(() => {
      const element = document.getElementById('dashboard');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToAbout() {
    setTimeout(() => {
      const element = document.getElementById('about');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToServices() {
    setTimeout(() => {
      const element = document.getElementById('services');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToCardiology() {
    setTimeout(() => {
      const element = document.getElementById('cardiology');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToNeurology() {
    setTimeout(() => {
      const element = document.getElementById('neurology');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToOrthopedics() {
    setTimeout(() => {
      const element = document.getElementById('orthopedics');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToPediatrics() {
    setTimeout(() => {
      const element = document.getElementById('pediatrics');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToDoctorLogin() {
    setTimeout(() => {
      const element = document.getElementById('doctor-login');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToDoctorDashboard() {
    setTimeout(() => {
      const element = document.getElementById('doctor-dashboard');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  scrollToContact() {
    setTimeout(() => {
      const element = document.getElementById('contact');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
  
  // Validation methods
  validateRegistration(): boolean {
    let isValid = true;
    
    // Full Name validation
    if (!this.registrationData.fullName.trim()) {
      this.validationErrors.registration.fullName = 'Full name is required';
      isValid = false;
    } else if (this.registrationData.fullName.trim().length < 2) {
      this.validationErrors.registration.fullName = 'Full name must be at least 2 characters';
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(this.registrationData.fullName)) {
      this.validationErrors.registration.fullName = 'Full name can only contain letters and spaces';
      isValid = false;
    }
    
    // Email validation
    if (!this.registrationData.email.trim()) {
      this.validationErrors.registration.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.registrationData.email)) {
      this.validationErrors.registration.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Phone validation
    if (!this.registrationData.phone.trim()) {
      this.validationErrors.registration.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(this.registrationData.phone)) {
      this.validationErrors.registration.phone = 'Please enter a valid 10-digit Indian mobile number';
      isValid = false;
    }
    
    // Date of Birth validation
    if (!this.registrationData.dateOfBirth) {
      this.validationErrors.registration.dateOfBirth = 'Date of birth is required';
      isValid = false;
    } else {
      const birthDate = new Date(this.registrationData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today) {
        this.validationErrors.registration.dateOfBirth = 'Date of birth cannot be in the future';
        isValid = false;
      } else if (age > 120) {
        this.validationErrors.registration.dateOfBirth = 'Please enter a valid date of birth';
        isValid = false;
      }
    }
    
    // Password validation
    if (!this.registrationData.password) {
      this.validationErrors.registration.password = 'Password is required';
      isValid = false;
    } else if (this.registrationData.password.length < 8) {
      this.validationErrors.registration.password = 'Password must be at least 8 characters long';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.registrationData.password)) {
      this.validationErrors.registration.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      isValid = false;
    }
    
    return isValid;
  }
  
  validateLogin(): boolean {
    let isValid = true;
    
    if (!this.loginData.email.trim()) {
      this.validationErrors.login.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.loginData.email)) {
      this.validationErrors.login.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!this.loginData.password) {
      this.validationErrors.login.password = 'Password is required';
      isValid = false;
    }
    
    return isValid;
  }
  
  validateDoctorLogin(): boolean {
    let isValid = true;
    
    if (!this.doctorLoginData.email.trim()) {
      this.validationErrors.doctorLogin.email = 'Doctor ID/Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.doctorLoginData.email)) {
      this.validationErrors.doctorLogin.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!this.doctorLoginData.password) {
      this.validationErrors.doctorLogin.password = 'Password is required';
      isValid = false;
    }
    
    return isValid;
  }
  
  isValidEmail(email: string): boolean {
    // Enhanced email pattern for healthcare application
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Additional checks for professional email format
    if (!emailRegex.test(email)) return false;
    
    // Check for consecutive dots
    if (email.includes('..')) return false;
    
    // Check for valid domain length
    const domain = email.split('@')[1];
    if (domain.length < 4 || domain.length > 253) return false;
    
    // Check for valid local part length
    const localPart = email.split('@')[0];
    if (localPart.length < 1 || localPart.length > 64) return false;
    
    return true;
  }
  
  clearValidationErrors(formType: 'registration' | 'login' | 'doctorLogin') {
    if (formType === 'registration') {
      this.validationErrors.registration = {
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        password: ''
      };
    } else if (formType === 'login') {
      this.validationErrors.login = {
        email: '',
        password: ''
      };
    } else if (formType === 'doctorLogin') {
      this.validationErrors.doctorLogin = {
        email: '',
        password: ''
      };
    }
  }
  
  // Role-based access control methods
  canAccessDoctorDashboard(): boolean {
    const token = this.authService.getToken();
    if (!token) {
      alert('Please login first');
      this.showLogin();
      return false;
    }
    
    const role = this.authService.extractRoleFromToken(token);
    if (role !== 'DOCTOR') {
      alert('Access denied: Doctor role required');
      this.showHome();
      return false;
    }
    
    return true;
  }
  
  canAccessPatientDashboard(): boolean {
    const token = this.authService.getToken();
    if (!token) {
      alert('Please login first');
      this.showLogin();
      return false;
    }
    
    const role = this.authService.extractRoleFromToken(token);
    if (role !== 'PATIENT') {
      alert('Access denied: Patient role required');
      this.showHome();
      return false;
    }
    
    return true;
  }
}
