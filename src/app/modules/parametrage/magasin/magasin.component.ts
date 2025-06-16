import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MagasinService } from 'src/app/core/services/magasin.service';
import { PopupComponent } from "../../shared/popup/popup.component";
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-magasin',
  templateUrl: 'magasin.component.html',
  styleUrl: 'magasin.component.scss',
  imports: [AngularSvgIconModule, CommonModule, PopupComponent, FormsModule],
})
export class MagasinComponent implements OnInit{

  protected magasinList: any[] = [];
  protected selectdID!: any;

  protected deletedPopUp = false;
  protected createPopUp = false;

   formData = {
    nommagasin: '',
  };

  constructor(private readonly magasinService: MagasinService) {}

    ngOnInit(): void {
    this.getAll();
  }
  getAll() {
    this.magasinService.getAll().subscribe({
      next: (response: any) => {
        this.magasinList = response;
      },
    });
}
  delete() {
    this.magasinService.delete(this.selectdID).subscribe({
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
    if (this.formData.nommagasin.trim()) {
      this.magasinService.create(this.formData).subscribe({
        next: (response: any) => {
          this.getAll();
          this.formData = {
            nommagasin: '',
          };
          this.createPopUp = false;
        },
      });
    }
  }
}
