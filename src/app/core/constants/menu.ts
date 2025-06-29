import { MenuItem } from '../models/menu.model';

export class Menu {
  public static pages: MenuItem[] = [
    {
      group: 'Base',
      separator: false,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/chart-pie.svg',
          label: 'Dashboard',
          route: '/dashboard',
          //children: [{ label: 'Nfts', route: '/dashboard/nfts' }],
        },
        // {
        //   icon: 'assets/icons/heroicons/outline/lock-closed.svg',
        //   label: 'Auth',
        //   route: '/auth',
        //   children: [
        //     { label: 'Sign up', route: '/auth/sign-up' },
        //     { label: 'Sign in', route: '/auth/sign-in' },
        //     { label: 'Forgot Password', route: '/auth/forgot-password' },
        //     { label: 'New Password', route: '/auth/new-password' },
        //     { label: 'Two Steps', route: '/auth/two-steps' },
        //   ],
        // },
        // {
        //   icon: 'assets/icons/heroicons/outline/exclamation-triangle.svg',
        //   label: 'Errors',
        //   route: '/errors',
        //   children: [
        //     { label: '404', route: '/errors/404' },
        //     { label: '500', route: '/errors/500' },
        //   ],
        // },
        // {
        //   icon: 'assets/icons/heroicons/outline/cube.svg',
        //   label: 'Components',
        //   route: '/components',
        //   children: [{ label: 'Table', route: '/components/table' }],
        // },
        {
          icon: 'assets/icons/heroicons/outline/list.svg',
          label: 'Liste des articles',
          route: '/articles',
        },
        {
          icon: 'assets/icons/heroicons/outline/stock.svg',
          label: 'Etat des stocks',
          route: '/etatstock',
        },
        {
          icon: 'assets/icons/heroicons/outline/cmd.svg',
          label: 'Commandes',
          route: '/commandes',
          children: [
            { label: 'Commande Achats', route: '/commandes/achat' },
            { label: 'Commande Transfert', route: '/commandes/transfert' },
            { label: 'Commande Vente', route: '/commandes/vente' },
          ],
        },
        {
          icon: 'assets/icons/heroicons/outline/mvt.svg',
          label: 'Liste des mouvements',
          route: '/mouvement',
        },

        {
          icon: 'assets/icons/heroicons/outline/params.svg',
          label: 'Paramétrage globale',
          route: '/parametrage',
          children: [
            { label: 'Categorie Article ', route: '/parametrage/categoriearticle' },
            { label: 'Extra ', route: '/parametrage/extra' },
            { label: 'Devises ', route: '/parametrage/devise' },
            { label: 'Fournisseur / Client ', route: '/fournisseur-client' },
            { label: 'Region / Magasin ', route: '/region-magasin' },
            { label: 'Gestion Utilisateurs ', route: '/gestionusers' },
              // { label: 'List des fournisseurs ', route: '/parametrage/fouenisseur' },
            //{ label: 'List des clients ', route: '/parametrage/client' },
            //{ label: 'List des regions ', route: '/parametrage/regions' },
           // { label: 'List des magasins ', route: '/parametrage/magasin' },

          ],
        },
      ],
    },
    // {
    //   group: 'Collaboration',
    //   separator: true,
    //   items: [
    //     {
    //       icon: 'assets/icons/heroicons/outline/download.svg',
    //       label: 'Download',
    //       route: '/download',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/gift.svg',
    //       label: 'Gift Card',
    //       route: '/gift',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/users.svg',
    //       label: 'Users',
    //       route: '/users',
    //     },
    //   ],
    // },
    // {
    //   group: 'Config',
    //   separator: false,
    //   items: [
    //     {
    //       icon: 'assets/icons/heroicons/outline/cog.svg',
    //       label: 'Settings',
    //       route: '/settings',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/bell.svg',
    //       label: 'Notifications',
    //       route: '/gift',
    //     },
    //     {
    //       icon: 'assets/icons/heroicons/outline/folder.svg',
    //       label: 'Folders',
    //       route: '/folders',
    //       children: [
    //         { label: 'Current Files', route: '/folders/current-files' },
    //         { label: 'Downloads', route: '/folders/download' },
    //         { label: 'Trash', route: '/folders/trash' },
    //       ],
    //     },
    //   ],
    // },
  ];
}
