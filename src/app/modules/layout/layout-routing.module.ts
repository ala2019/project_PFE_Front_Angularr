import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ArticlesComponent } from '../articles/articles.component';
import { CmdAchatComponent } from '../commande/commandeachat/cmdachat.component';
import { CmdTransfertComponent } from '../commande/commandetransfert/cmdtransfert.component';

import { MouvementComponent } from '../mouvement/mouvement.component';
import { DeviseComponent } from '../parametrage/devise/devise.component';
import { FounisseurComponent } from '../parametrage/fournisseur/fournisseur.component';
import { RegionComponent } from '../parametrage/region/region.component';
import { MagasinComponent } from '../parametrage/magasin/magasin.component';
import { ClientComponent } from '../parametrage/client/client.component';
import { CategoriearticleComponent } from '../parametrage/categoriearticle/categoriearticle.component';
import { ExtraComponent } from '../parametrage/extra/extracomponent';
import { RegionMagasinComponent } from '../parametrage/region-magasin/region-magasin.component';
import { FournisseurClientComponent } from '../parametrage/fournisseur-client/fournisseur-client.component';
import { GestionusersComponent } from '../parametrage/GestionUsers/gestionusers.component';
import { CmdventetComponent } from '../commande/commandevente/cmdvente.component';
import { StockComponent } from '../stock/stock.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
      }
    ]
  },

  {
    path: 'components',
    component: LayoutComponent,
    loadChildren: () => import('../uikit/uikit.module').then((m) => m.UikitModule),
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'articles',
        component: ArticlesComponent,
      },
      {
        path: 'commandes/achat',
        component: CmdAchatComponent,
      },
      {
        path: 'commandes/transfert',
        component: CmdTransfertComponent,
      },
      {
        path: 'commandes/vente',
        component: CmdventetComponent,
      },
      {
        path: 'etatstock',
        component: StockComponent,
      },
      {
        path: 'mouvement',
        component: MouvementComponent,
      },
      {
        path: 'parametrage/extra',
        component: ExtraComponent,
      },
      // {
      //   path: 'parametrage/client',
      //   component: ClientComponent,
      // },
      {
        path: 'parametrage/devise',
        component: DeviseComponent,
      },
      // {
      //   path: 'parametrage/fouenisseur',
      //   component: FounisseurComponent,
      // },
      // {
      //   path: 'parametrage/regions',
      //   component: RegionComponent,
      // },
      // {
      //   path: 'parametrage/magasin',
      //   component: MagasinComponent,
      // },
      {
        path: 'parametrage/categoriearticle',
        component: CategoriearticleComponent,
      },
       {
        path: 'parametrage/region-magasin',
        component: RegionMagasinComponent,
      },
      {
        path: 'parametrage/fournisseur-client',
        component: FournisseurClientComponent,
      },
      {
        path: 'parametrage/gestionusers',
        component: GestionusersComponent,
      },
    ],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
