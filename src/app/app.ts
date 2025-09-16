import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsultationRecordsComponent } from './consultation-records/consultation-records';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'HealthCare Management System';
}
