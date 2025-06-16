import { Component } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TableRowComponent } from '../../uikit/pages/table/components/table-row/table-row.component';
import { TableFooterComponent } from '../../uikit/pages/table/components/table-footer/table-footer.component';
import { TableHeaderComponent } from '../../uikit/pages/table/components/table-header/table-header.component';

@Component({
  selector: 'app-fournisseur',
  templateUrl: 'fournisseur.component.html',
  styleUrl: 'fournisseur.component.scss',
  imports: [AngularSvgIconModule, TableRowComponent, TableFooterComponent, TableHeaderComponent],
})
export class FounisseurComponent {
}
