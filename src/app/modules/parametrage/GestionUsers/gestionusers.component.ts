import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../shared/popup/popup.component';

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
  formData: any = this.resetForm();
  isEditing = false;
  showPassword = false;

  // Role options
  roles = [
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'SALES', label: 'Vendeur' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.getUsers();
    this.getStores();
  }

  getUsers(): void {
    // Mock data - replace with actual service call
    this.users = [
      { 
        idUser: 1, 
        email: 'admin@example.com', 
        login: 'admin', 
        password: '********', 
        store: 'Magasin Central',
        role: 'ADMIN',
        roleLabel: 'Administrateur'
      },
      { 
        idUser: 2, 
        email: 'vendeur1@example.com', 
        login: 'vendeur1', 
        password: '********', 
        store: 'Magasin Nord',
        role: 'SALES',
        roleLabel: 'Vendeur'
      },
      { 
        idUser: 3, 
        email: 'vendeur2@example.com', 
        login: 'vendeur2', 
        password: '********', 
        store: 'Magasin Sud',
        role: 'SALES',
        roleLabel: 'Vendeur'
      }
    ];
  }

  getStores(): void {
    // Mock data - replace with actual service call
    this.stores = [
      { idStore: 1, nomStore: 'Magasin Central' },
      { idStore: 2, nomStore: 'Magasin Nord' },
      { idStore: 3, nomStore: 'Magasin Sud' },
      { idStore: 4, nomStore: 'Magasin Est' },
      { idStore: 5, nomStore: 'Magasin Ouest' }
    ];
  }

  save(): void {
    // Comprehensive validation for all required fields
    if (!this.formData.email || !this.formData.login || !this.formData.store || !this.formData.role) {
      return; // Don't save if any required field is missing
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
      const index = this.users.findIndex(u => u.idUser === this.formData.idUser);
      if (index !== -1) {
        const selectedStore = this.stores.find(s => s.idStore === this.formData.store);
        const selectedRole = this.roles.find(r => r.value === this.formData.role);
        this.users[index] = { 
          ...this.formData,
          store: selectedStore?.nomStore,
          roleLabel: selectedRole?.label
        };
      }
      this.afterSave();
    } else {
      // Add new user
      const selectedStore = this.stores.find(s => s.idStore === this.formData.store);
      const selectedRole = this.roles.find(r => r.value === this.formData.role);
      const newUser = {
        ...this.formData,
        idUser: Math.max(...this.users.map(u => u.idUser), 0) + 1,
        store: selectedStore?.nomStore,
        roleLabel: selectedRole?.label
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
      store: this.stores.find(s => s.nomStore === user.store)?.idStore,
      confirmPassword: '' // Clear confirm password when editing
    };
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.users = this.users.filter(u => u.idUser !== id);
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
      role: 'SALES'
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