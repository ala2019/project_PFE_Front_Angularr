import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../shared/popup/popup.component';
import { UserService } from 'src/app/core/services/user.service';

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
  stores: any[] = [];
  regions: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;
  showPassword = false;

  // Role options
  roles = [
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'SALES', label: 'Commercial' },
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.getUsers();
    this.getStores();
    this.getRegions();
  }

  getUsers(): void {
    this.userService.getAll().subscribe({
      next: (value) => {
        this.users = value;
      },
      error: (err) => {},
    });
  }

  getStores(): void {
    // Mock data - replace with actual service call
    this.stores = [
      { idStore: 1, nomStore: 'Magasin Central' },
      { idStore: 2, nomStore: 'Magasin Nord' },
      { idStore: 3, nomStore: 'Magasin Sud' },
      { idStore: 4, nomStore: 'Magasin Est' },
      { idStore: 5, nomStore: 'Magasin Ouest' },
    ];
  }

  getRegions(): void {
    // Mock data - replace with actual service call
    this.regions = [
      { idRegion: 1, nomRegion: 'Sousse' },
      { idRegion: 2, nomRegion: 'Monastir' },
      { idRegion: 3, nomRegion: 'Tunis' },
      { idRegion: 4, nomRegion: 'Nabeul' },
    ];
  }

  save(): void {
    // Validation de base pour les champs communs
    if (!this.formData.email || !this.formData.login || !this.formData.role) {
      return; // Don't save if any required field is missing
    }

    // Validation conditionnelle selon le rôle
    if (this.formData.role === 'ADMIN') {
      // Pour ADMIN : région obligatoire, magasin non obligatoire
      if (!this.formData.region) {
        return; // Don't save if region is missing for ADMIN
      }
    } else if (this.formData.role === 'SALES') {
      // Pour SALES : magasin obligatoire, région non obligatoire
      if (!this.formData.store) {
        return; // Don't save if store is missing for SALES
      }
    }

    // Check if passwords match for new users
    if (!this.isEditing && this.formData.password !== this.formData.confirmPassword) {
      return; // Don't save if passwords don't match
    }

    // Check if password is provided for new users
    if (!this.isEditing && !this.formData.password) {
      return; // Don't save if password is missing for new users
    }

    if (this.isEditing) {
      // Update existing user
      const index = this.users.findIndex((u) => u.idUser === this.formData.idUser);
      if (index !== -1) {
        const selectedStore = this.stores.find((s) => s.idStore === this.formData.store);
        const selectedRegion = this.regions.find((r) => r.idRegion === this.formData.region);
        const selectedRole = this.roles.find((r) => r.value === this.formData.role);
        this.users[index] = {
          ...this.formData,
          store: selectedStore?.nomStore || '',
          region: selectedRegion?.nomRegion || '',
          roleLabel: selectedRole?.label,
        };
      }
      this.afterSave();
    } else {
      // Add new user
      const selectedStore = this.stores.find((s) => s.idStore === this.formData.store);
      const selectedRegion = this.regions.find((r) => r.idRegion === this.formData.region);
      const selectedRole = this.roles.find((r) => r.value === this.formData.role);
      const newUser = {
        ...this.formData,
        idUser: Math.max(...this.users.map((u) => u.idUser), 0) + 1,
        store: selectedStore?.nomStore || '',
        region: selectedRegion?.nomRegion || '',
        roleLabel: selectedRole?.label,
      };
      // Remove confirmPassword from the user object before saving
      delete newUser.confirmPassword;
      this.users.push(newUser);
      this.afterSave();
    }
  }

  edit(user: any): void {
    this.formData = {
      ...user,
      store: this.stores.find((s) => s.nomStore === user.store)?.idStore,
      region: this.regions.find((r) => r.nomRegion === user.region)?.idRegion,
      confirmPassword: '', // Clear confirm password when editing
    };
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.users = this.users.filter((u) => u.idUser !== id);
    this.selectdID = null;
    this.selectedUser = null;
  }

  resetForm(): any {
    return {
      email: '',
      login: '',
      password: '',
      confirmPassword: '',
      store: '',
      region: '',
      role: 'SALES',
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
  }

  closeModal(): void {
    this.createPopUp = false;
    this.cancel();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private afterSave(): void {
    this.closeModal();
  }
}
