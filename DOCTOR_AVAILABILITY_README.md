# Doctor Availability Module

## Overview
A complete Angular application for managing doctor availability in a healthcare system. Features a modern, responsive UI with a professional healthcare color palette.

## Features
- **Search Doctor Availability**: Search for availability by Doctor ID
- **Display Availability**: View availability in clean, card-based layout with time slot badges
- **Add New Availability**: Form to add new availability entries
- **Delete Availability**: Remove availability entries with confirmation
- **Responsive Design**: Works on desktop and mobile devices

## Color Palette
- **Primary (#2CA6A4)**: Primary buttons, active states
- **Light Teal (#E0F7F6)**: Hover states, card borders
- **Navy Blue (#0D47A1)**: Headers, navigation
- **Soft Green (#81C784)**: Success messages
- **Neutral Colors**: White, light gray, dark gray for backgrounds and text
- **Accent Colors**: Orange (#FF7043) for warnings, Red (#E53935) for errors

## API Integration
The module connects to Spring Boot backend endpoints:
- `GET /api/v1/availability/doctor/{doctorID}` - Get doctor availability
- `POST /api/v1/availability` - Add new availability
- `DELETE /api/v1/availability/{doctorID}/{date}` - Delete availability

## File Structure
```
src/app/
├── services/
│   └── availability.service.ts          # API service layer
├── components/
│   ├── availability-dashboard.component.* # Main dashboard
│   └── add-availability-form.component.*  # Add form
├── doctor-availabilty/
│   └── doctor-availabilty.*             # Main module component
├── app.component.*                      # Main app with navigation
└── styles.css                          # Global healthcare theme
```

## Usage
1. Start the Angular development server: `ng serve`
2. Navigate to `http://localhost:4200`
3. Use the search form to find doctor availability
4. Add new availability using the form at the bottom
5. Delete availability entries using the delete button on each card

## Backend Requirements
Ensure your Spring Boot backend is running on `http://localhost:8080` with the availability endpoints configured.