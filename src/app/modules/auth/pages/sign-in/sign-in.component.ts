import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularSvgIconModule]
})
export class SignInComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  errorMessage = '';
  passwordTextType = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    const { login, password } = this.form.value;
    this.authService.login(login, password).subscribe({
      next: (res) => {
        if (res && res.tokenValue) {
          this.authService.setToken(res.tokenValue);
          alert('Connexion réussie !');
          this.router.navigate(['/dashboard']);
        } else {
          alert('Réponse inattendue du serveur.');
        }
      },
      error: (error) => {
        this.errorMessage = 'Login ou mot de passe incorrect';
        alert('Login ou mot de passe incorrect');
      }
    });
  }
}
