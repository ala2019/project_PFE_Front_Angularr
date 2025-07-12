import { Injectable, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Menu } from 'src/app/core/constants/menu';
import { MenuItem, SubMenuItem } from 'src/app/core/models/menu.model';
import { AuthService } from 'src/app/core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService implements OnDestroy {
  private _showSidebar = signal(true);
  private _showMobileMenu = signal(false);
  private _pagesMenu = signal<MenuItem[]>([]);
  private _subscription = new Subscription();

  constructor(private router: Router, private authService: AuthService) {
    /** Set dynamic menu based on role */
    const roles = this.authService.getUserRoles();
    console.log('MenuService - roles récupérés:', roles);
    console.log('MenuService - est administrateur:', roles.includes('administrateur'));
    
    let filteredMenu: MenuItem[];
    
    if (roles.includes('administrateur')) {
      // Administrateurs voient le menu complet
      console.log('MenuService - Affichage du menu complet pour administrateur');
      filteredMenu = Menu.pages;
    } else {
      // Non-administrateurs voient seulement certains éléments
      console.log('MenuService - Affichage du menu filtré pour non-administrateur');
      filteredMenu = [
        {
          group: 'Menu',
          separator: false,
          items: Menu.pages[0].items.filter(
            (item) => 
              item.label === 'Liste des articles' ||
              item.label === 'Etat des stocks' ||
              item.label === 'Commandes' ||
              item.label === 'Liste des mouvements',
          ),
        },
      ];
    }
    
    console.log('MenuService - Menu final:', filteredMenu);
    this._pagesMenu.set(filteredMenu);

    let sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        /** Expand menu base on active route */
        this._pagesMenu().forEach((menu) => {
          let activeGroup = false;
          menu.items.forEach((subMenu) => {
            const active = this.isActive(subMenu.route);
            subMenu.expanded = active;
            subMenu.active = active;
            if (active) activeGroup = true;
            if (subMenu.children) {
              this.expand(subMenu.children);
            }
          });
          menu.active = activeGroup;
        });
      }
    });
    this._subscription.add(sub);
  }

  get showSideBar() {
    return this._showSidebar();
  }
  get showMobileMenu() {
    return this._showMobileMenu();
  }
  get pagesMenu() {
    return this._pagesMenu();
  }

  set showSideBar(value: boolean) {
    this._showSidebar.set(value);
  }
  set showMobileMenu(value: boolean) {
    this._showMobileMenu.set(value);
  }

  public toggleSidebar() {
    this._showSidebar.set(!this._showSidebar());
  }

  public toggleMenu(menu: any) {
    this.showSideBar = true;
    menu.expanded = !menu.expanded;
  }

  public toggleSubMenu(submenu: SubMenuItem) {
    submenu.expanded = !submenu.expanded;
  }

  private expand(items: Array<any>) {
    items.forEach((item) => {
      item.expanded = this.isActive(item.route);
      if (item.children) this.expand(item.children);
    });
  }

  public isActive(instruction: any): boolean {
    return this.router.isActive(this.router.createUrlTree([instruction]), {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  public refreshMenu(): void {
    console.log('MenuService - Rafraîchissement du menu');
    const roles = this.authService.getUserRoles();
    console.log('MenuService - roles récupérés lors du rafraîchissement:', roles);
    
    let filteredMenu: MenuItem[];
    
    if (roles.includes('administrateur')) {
      console.log('MenuService - Affichage du menu complet pour administrateur');
      filteredMenu = Menu.pages;
    } else {
      console.log('MenuService - Affichage du menu filtré pour non-administrateur');
      filteredMenu = [
        {
          group: 'Menu',
          separator: false,
          items: Menu.pages[0].items.filter(
            (item) => 
              item.label === 'Liste des articles' ||
              item.label === 'Etat des stocks' ||
              item.label === 'Commandes' ||
              item.label === 'Liste des mouvements',
          ),
        },
      ];
    }
    
    console.log('MenuService - Menu final après rafraîchissement:', filteredMenu);
    this._pagesMenu.set(filteredMenu);
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
