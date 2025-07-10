import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

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
    private router: Router,
    private notificationService: NotificationService
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

  // Effacer le message d'erreur quand l'utilisateur modifie les champs
  clearErrorMessage() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    const { login, password } = this.form.value;
    this.authService.login(login, password).subscribe({
      next: (res) => {
        if (res && res.tokenValue) {
          this.authService.setToken(res.tokenValue);
          this.notificationService.success(
            'Connexion réussie !',
            'Vous êtes maintenant connecté à votre espace Gesti.Com'
          );
          this.router.navigate(['/dashboard']);
        } else {
          this.notificationService.error(
            'Erreur de connexion',
            'Réponse inattendue du serveur. Veuillez réessayer.'
          );
        }
      },
      error: (error) => {
        this.errorMessage = '❌ Échec de connexion';
        this.notificationService.error(
          'Échec de connexion',
          'Login ou mot de passe incorrect. Veuillez vérifier vos identifiants.'
        );
      }
    });
  }
}
