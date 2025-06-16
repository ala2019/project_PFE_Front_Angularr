import { Component } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TableRowComponent } from '../../uikit/pages/table/components/table-row/table-row.component';
import { TableFooterComponent } from '../../uikit/pages/table/components/table-footer/table-footer.component';
import { TableHeaderComponent } from '../../uikit/pages/table/components/table-header/table-header.component';
import { DeviseService } from 'src/app/core/services/devise.service';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-devise',
  templateUrl: 'devise.component.html',
  styleUrl: 'devise.component.scss',
  imports: [AngularSvgIconModule, CommonModule, PopupComponent, FormsModule],
})
export class DeviseComponent {

  
  
    protected deviseList: any[] = [];
    protected selectdID!: any;
  
    protected deletedPopUp = false;
    protected createPopUp = false;
  
     formData = {
      devise: '',
      symbole:'',
      tauxChange:'',
    };
  
    constructor(private readonly deviseService: DeviseService) {}
  
      ngOnInit(): void {
      this.getAll();
    }
    getAll() {
      this.deviseService.getAll().subscribe({
        next: (response: any) => {
          this.deviseList = response;
        },
      });
  }
    delete() {
      this.deviseService.delete(this.selectdID).subscribe({
        next: (response: any) => {
          this.getAll();
        },
        error: () => {
          this.getAll();
        },
      });
      this.selectdID = null;
    }
      onSubmit() {
      if (this.formData.devise.trim()) {
        this.deviseService.create(this.formData).subscribe({
          next: (response: any) => {
            this.getAll();
            this.formData = {
              devise: '',
              symbole:'',
              tauxChange:'',
            };
            this.createPopUp = false;
          },
        });
      }
    }
}
