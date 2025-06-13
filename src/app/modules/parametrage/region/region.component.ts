import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RegionService } from 'src/app/core/services/region.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-region',
  templateUrl: 'region.component.html',
  styleUrl: 'region.component.scss',
  imports: [AngularSvgIconModule, CommonModule, PopupComponent, FormsModule],
})
export class RegionComponent implements OnInit {
  protected regionList: any[] = [];
  protected selectdID!: any;

  protected deletedPopUp = false;
  protected createPopUp = false;

  formData = {
    nomregion: '',
  };

  constructor(private readonly regionService: RegionService) {}

  ngOnInit(): void {
    this.getAll();
  }

  getAll() {
    this.regionService.getAll().subscribe({
      next: (response: any) => {
        this.regionList = response;
      },
    });
  }

  delete() {
    this.regionService.delete(this.selectdID).subscribe({
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
    if (this.formData.nomregion.trim()) {
      this.regionService.create(this.formData).subscribe({
        next: (response: any) => {
          this.getAll();
          this.formData = {
            nomregion: '',
          };
          this.createPopUp = false;
        },
      });
    }
  }
}
