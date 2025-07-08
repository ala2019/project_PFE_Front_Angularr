import { Component, OnInit } from '@angular/core';
import { NftAuctionsTableComponent } from '../../components/nft/nft-auctions-table/nft-auctions-table.component';
import { NftChartCardComponent } from '../../components/nft/nft-chart-card/nft-chart-card.component';
import { NftDualCardComponent } from '../../components/nft/nft-dual-card/nft-dual-card.component';
import { NftHeaderComponent } from '../../components/nft/nft-header/nft-header.component';
import { NftSingleCardComponent } from '../../components/nft/nft-single-card/nft-single-card.component';
import { Nft } from '../../models/nft';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nft',
  templateUrl: './nft.component.html',
  imports: [],
})
export class NftComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const roles = this.auth.getUserRoles();
    if (!roles.includes('administrateur')) this.router.navigate(['/articles']);
  }
}
