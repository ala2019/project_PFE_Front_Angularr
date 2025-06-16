import { Component, OnInit } from '@angular/core';
import { ClientComponent } from '../client/client.component';
import { FounisseurComponent } from '../fournisseur/fournisseur.component';

@Component({
  selector: 'app-fournisseur-client',
  templateUrl: 'fournisseur-client.component.html',
  standalone: true,
  imports: [ClientComponent, FounisseurComponent],
})
export class FournisseurClientComponent implements OnInit {
  protected component: 'fournisseur' | 'client' = 'fournisseur';

  constructor() {}

  ngOnInit(): void {}
}
