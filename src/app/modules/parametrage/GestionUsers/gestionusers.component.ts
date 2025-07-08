import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../shared/popup/popup.component';
import { UserService } from 'src/app/core/services/user.service';
import { UserManagementService } from 'src/app/core/services/user-management.service';
import { MagasinService } from 'src/app/core/services/magasin.service';
import { RegionService } from 'src/app/core/services/region.service';

@Component({
  selector: 'app-gestionusers',
  templateUrl: 'gestionusers.component.html',
  styleUrl: 'gestionusers.component.scss',
  imports: [CommonModule, FormsModule, PopupComponent],
})
export class GestionusersComponent implements OnInit {
  // Popup management
  createPopUp = false;
  deletedPopUp = false;

  // Selection tracking
  selectdID: number | null = null;
  selectedUser: any = null;

  users: any[] = [];
  filters = {
    email: '',
    login: '',
    role: ''
  };
  filteredUsers: any[] = [];
  magasins: any[] = [];
  regions: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;
  showPassword = false;
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' = 'success';

  // Role options
  roles = [
    { idRole: 1, value: 'administrateur', label: 'administrateur' },
    { idRole: 2, value: 'commercial', label: 'commercial' },
  ];

  constructor(
    private userService: UserService,
    private userManagementService: UserManagementService,
    private magasinService: MagasinService,
    private regionService: RegionService
  ) {}

  ngOnInit(): void {
    this.getUsers();
    this.loadMagasins();
    this.loadRegions();
    this.testBackendConnection();
  }

  testBackendConnection(): void {
    console.log('Test de connexion au backend...');
    this.userManagementService.getAll().subscribe({
      next: (data: any) => {
        console.log('✅ Connexion au backend réussie');
      },
      error: (error: any) => {
        console.error('❌ Erreur de connexion au backend:', error);
      }
    });
  }

  loadMagasins() {
    console.log('Chargement des magasins...');
    this.magasinService.getAll().subscribe({
      next: (data) => {
        console.log('Liste des magasins:', data);
        if (Array.isArray(data) && data.length > 0) {
          console.log('Premier magasin:', data[0]);
          console.log('Propriétés du premier magasin:', Object.keys(data[0]));
        }
        this.magasins = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des magasins:', error);
        this.magasins = [];
      }
    });
  }

  loadRegions() {
    console.log('Chargement des régions...');
    this.regionService.getAll().subscribe({
      next: (data) => {
        console.log('Régions reçues:', data);
        if (Array.isArray(data) && data.length > 0) {
          console.log('Première région:', data[0]);
          console.log('Propriétés de la première région:', Object.keys(data[0]));
        }
        this.regions = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des régions:', error);
        this.regions = [];
      }
    });
  }

  getUsers(): void {
    this.userManagementService.getAll().subscribe({
      next: (value: any) => {
        this.users = value;
        this.filteredUsers = [...this.users];
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      },
    });
  }

  save(): void {

    
    console.log('=== DÉBUT DE LA MÉTHODE SAVE ===');
    console.log('formData complet:', this.formData);
    console.log('Propriétés de formData:', Object.keys(this.formData));
    console.log('Email:', this.formData.email);
    console.log('Login:', this.formData.login);
    console.log('Password:', this.formData.password);
    console.log('Role:', this.formData.role);
    console.log('Magasin ID:', this.formData.magasin);
    console.log('Region ID:', this.formData.region);
    console.log('isEditing:', this.isEditing);
    
    // Validation de base pour les champs communs
    if (!this.formData.email || !this.formData.login || !this.formData.role) {
      console.error('Champs requis manquants');
      this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    // Validation conditionnelle selon le rôle
    if (this.formData.role === 'administrateur') {
      // Pour ADMIN : région obligatoire, magasin non obligatoire
      if (!this.formData.region) {
        console.error('Région requise pour un administrateur');
        this.showNotification('Une région est requise pour un administrateur', 'error');
        return;
      }
    } else if (this.formData.role === 'commercial') {
      // Pour Commercial : magasin obligatoire, région non obligatoire
      if (!this.formData.magasin) {
        console.error('Magasin requis pour un commercial');
        this.showNotification('Un magasin est requis pour un commercial', 'error');
        return;
      }
    }

    // Check if passwords match for new users
    if (!this.isEditing && this.formData.password !== this.formData.confirmPassword) {
      console.error('Les mots de passe ne correspondent pas');
      this.showNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    // Check if password is provided for new users
    if (!this.isEditing && !this.formData.password) {
      console.error('Mot de passe requis pour un nouvel utilisateur');
      this.showNotification('Un mot de passe est requis pour un nouvel utilisateur', 'error');
      return;
    }

    // For editing, if password is provided, it should match confirmPassword
    if (this.isEditing && this.formData.password && this.formData.password !== this.formData.confirmPassword) {
      console.error('Les mots de passe ne correspondent pas');
      this.showNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    const selectedRole = this.roles.find((r: any) => r.value === this.formData.role);

    const userData = {
      email: this.formData.email,
      login: this.formData.login,
      motDePasse: this.formData.password,
      roles: selectedRole ? [{
        idRole: selectedRole.idRole,
        role: selectedRole.value
      }] : [],
      magasin: this.formData.magasin ? { idMagasin: Number(this.formData.magasin) } : null,
      region: this.formData.region ? { idRegion: Number(this.formData.region) } : null,
    };


    // For editing, remove password if it's empty
    if (this.isEditing && !this.formData.password) {
      delete userData.motDePasse;
    }

    // Log des données avant envoi
    console.log('=== DONNÉES À ENVOYER AU BACKEND ===');
    console.log('userData complet:', userData);
    console.log('Propriétés de userData:', Object.keys(userData));
    console.log('Email:', userData.email);
    console.log('Login:', userData.login);
    console.log('MotDePasse:', userData.motDePasse);
    console.log('Role:', userData.roles);
    console.log('Magasin ID:', userData.magasin);
    console.log('Region ID:', userData.region);
    console.log('JSON stringifié:', JSON.stringify(userData, null, 2));
    console.log('=====================================');

    if (this.isEditing) {
      // Update existing user
      this.userManagementService.update(this.formData.idUser, userData).subscribe({
        next: (response: any) => {
          console.log('Utilisateur mis à jour:', response);
          this.showNotification('Utilisateur mis à jour avec succès', 'success');
          this.getUsers(); // Refresh the list
          this.afterSave();
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.showNotification('Erreur lors de la mise à jour: ' + (error.error?.message || error.message || 'Erreur inconnue'), 'error');
        }
      });
    } else {
      // Add new user
      this.userManagementService.create(userData).subscribe({
        next: (response: any) => {
          console.log('Utilisateur créé:', response);
          this.showNotification('Utilisateur créé avec succès', 'success');
          this.getUsers(); // Refresh the list
          this.afterSave();
        },
        error: (error: any) => {
          console.error('Erreur lors de la création:', error);
          this.showNotification('Erreur lors de la création: ' + (error.error?.message || error.message || 'Erreur inconnue'), 'error');
        }
      });
    }
  }

  edit(user: any): void {
    console.log('=== DÉBUT DE LA MÉTHODE EDIT ===');
    console.log('User reçu:', user);
    console.log('User role:', user.role);
    console.log('User magasin:', user.magasin);
    console.log('User region:', user.region);
    
    this.selectedUser = user;
    this.formData = {
      idUser: user.idUser,
      email: user.email,
      login: user.login,
      password: '', // Clear password when editing
      confirmPassword: '', // Clear confirm password when editing
      magasin: user.magasin?.idMagasin || '',
      region: user.region?.idRegion || '',
      role: user.role?.role || '',
    };
    
    console.log('formData après initialisation:', this.formData);
    console.log('=== FIN DE LA MÉTHODE EDIT ===');
    
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.userManagementService.delete(id).subscribe({
      next: (response: any) => {
        console.log('Utilisateur supprimé avec succès:', response);
        this.showNotification('Utilisateur supprimé avec succès', 'success');
        this.users = this.users.filter((u) => u.idUser !== id);
        this.selectdID = null;
        this.selectedUser = null;
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression:', error);
        this.showNotification('Erreur lors de la suppression: ' + (error.error?.message || error.message || 'Erreur inconnue'), 'error');
      }
    });
  }

  resetForm(): any {
    return {
      email: '',
      login: '',
      password: '',
      confirmPassword: '',
      magasin: '',
      region: '',
      role: 'commercial',
    };
  }

  cancel(): void {
    this.formData = this.resetForm();
    this.isEditing = false;
    this.showPassword = false;
  }

  // Modal management methods
  openModal(): void {
    this.createPopUp = true;
    this.isEditing = false;
    this.formData = this.resetForm();
    this.loadMagasins();
    this.loadRegions();
  }

  closeModal(): void {
    this.createPopUp = false;
    this.cancel();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onRoleChange(): void {
    console.log('Rôle changé vers:', this.formData.role);
    
    // Réinitialiser les champs selon le rôle
    if (this.formData.role === 'administrateur') {
      // Pour administrateur : vider le magasin, garder la région
      this.formData.magasin = '';
    } else if (this.formData.role === 'commercial') {
      // Pour commercial : vider la région, garder le magasin
      this.formData.region = '';
    }
    
    console.log('formData après changement de rôle:', this.formData);
  }

  private afterSave(): void {
    this.closeModal();
  }

  selectUser(user: any): void {
    this.selectdID = user?.idUser;
    this.selectedUser = user;
  }

  // Logique de filtre harmonisée
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const emailMatch = !this.filters.email ||
        user.email?.toLowerCase().includes(this.filters.email.toLowerCase());
      const loginMatch = !this.filters.login ||
        user.login?.toLowerCase().includes(this.filters.login.toLowerCase());
      const roleMatch = !this.filters.role ||
        user.role?.role === this.filters.role;
      return emailMatch && loginMatch && roleMatch;
    });
  }

  clearFilters(): void {
    this.filters = {
      email: '',
      login: '',
      role: ''
    };
    this.filteredUsers = [...this.users];
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.email || this.filters.login || this.filters.role);
  }

  getFilteredCount(): number {
    return this.filteredUsers.length;
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.notificationMessage = message;
    this.notificationType = type;
    setTimeout(() => {
      this.notificationMessage = null;
    }, 3000);
  }

  closeNotification() {
    this.notificationMessage = null;
  }
}
