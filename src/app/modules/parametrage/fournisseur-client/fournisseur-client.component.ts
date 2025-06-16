import { Component } from '@angular/core';
import { ClientComponent } from '../client/client.component';
import { FounisseurComponent } from '../fournisseur/fournisseur.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fournisseur-client',
  standalone: true,
  imports: [CommonModule, ClientComponent, FounisseurComponent],
  templateUrl: './fournisseur-client.component.html',
})
export class FournisseurClientComponent {

  
  component: 'fournisseur' | 'client' = 'fournisseur';

  setComponent(type: 'fournisseur' | 'client') {
    this.component = type;
  }
}

