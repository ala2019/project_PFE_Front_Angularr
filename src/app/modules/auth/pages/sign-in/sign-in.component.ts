import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { LoginService } from 'src/app/core/services/login.service';

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
    private loginService: LoginService,
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
    console.log('Tentative de connexion avec:', { login, password });
    
    this.loginService.login(login, password).subscribe({
      next: (res) => {
        console.log('Réponse du serveur:', res);
        const token = res.token || res;
        localStorage.setItem('token', token);
        console.log('Token stocké:', token);
        console.log('Redirection vers /dashboard...');
        this.router.navigate(['/dashboard']).then(() => {
          console.log('Redirection réussie');
        }).catch(err => {
          console.error('Erreur de redirection:', err);
        });
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.errorMessage = "Login ou mot de passe incorrect";
      }
    });
  }
}
