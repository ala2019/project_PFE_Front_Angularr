import { Component, OnInit } from '@angular/core';
import { MagasinComponent } from '../magasin/magasin.component';
import { RegionComponent } from '../region/region.component';

@Component({
  selector: 'app-region-magasin',
  templateUrl: 'region-magasin.component.html',
  standalone: true,
  imports: [MagasinComponent, RegionComponent],
})
export class RegionMagasinComponent implements OnInit {
  protected component: 'region' | 'magasin' = 'region';

  constructor() {}

  ngOnInit(): void {}
}
