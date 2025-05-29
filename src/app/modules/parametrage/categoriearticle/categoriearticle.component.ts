import { selectors } from '@playwright/test';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TableRowComponent } from '../../uikit/pages/table/components/table-row/table-row.component';
import { TableFooterComponent } from '../../uikit/pages/table/components/table-footer/table-footer.component';
import { TableHeaderComponent } from '../../uikit/pages/table/components/table-header/table-header.component';
import { Component } from '@angular/core';

@Component({
  selector: 'app-categoriearticle',
  templateUrl: 'categoriearticle.component.html',
  styleUrl: 'categoriearticle.component.scss',
  imports: [AngularSvgIconModule, TableRowComponent, TableFooterComponent, TableHeaderComponent],
})
export class CategoriearticleComponent {}
