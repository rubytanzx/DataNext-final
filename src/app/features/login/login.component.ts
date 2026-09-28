import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  id = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.error.set('');
    this.loading.set(true);

    setTimeout(() => {
      const ok = this.auth.login(this.id, this.password);
      this.loading.set(false);
      if (ok) {
        this.router.navigate(['/whats-new']);
      } else {
        this.error.set('Invalid credentials. Please try again.');
      }
    }, 400);
  }
}
