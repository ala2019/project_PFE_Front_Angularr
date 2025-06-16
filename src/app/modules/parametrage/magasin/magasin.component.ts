import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MagasinService } from 'src/app/core/services/magasin.service';
import { PopupComponent } from "../../shared/popup/popup.component";
import { FormsModule } from '@angular/forms';
import { RegionService } from 'src/app/core/services/region.service';


@Component({
  selector: 'app-magasin',
  templateUrl: 'magasin.component.html',
  styleUrl: 'magasin.component.scss',
  imports: [AngularSvgIconModule, CommonModule, PopupComponent, FormsModule],
})
export class MagasinComponent implements OnInit{

  protected magasinList: any[] = [];
  protected regionList : any[] = [];
  protected selectdID!: any;
  regions: any[] = [];


  protected deletedPopUp = false;
  protected createPopUp = false;

   formData = {
    nommagasin: '',
    regionId: null
  };

  constructor(
    private readonly magasinService: MagasinService,
     private regionService: RegionService) {}

    ngOnInit(): void {
    this.getAll();
    this.loadRegions();

  }

  loadRegions() {
  this.regionService.getAll().subscribe((data) => {
    this.regionList = data;
  });}

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
  if (this.formData.nommagasin.trim() && this.formData.regionId) {
    this.magasinService.create(this.formData).subscribe({
      next: (response: any) => {
        this.getAll();
        this.formData = {
          nommagasin: '',
          regionId: null
        };
        this.createPopUp = false;
      },
      error: (err) => {
        console.error("Erreur lors de la création du magasin :", err);
      }
    });
  } else {
    console.warn("Nom du magasin ou région non rempli.");
  }
}

}
