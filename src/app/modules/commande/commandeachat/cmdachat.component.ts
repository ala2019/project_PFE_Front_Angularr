import { Component, signal } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TableRowComponent } from '../../uikit/pages/table/components/table-row/table-row.component';
import { User } from '../../uikit/pages/table/model/user.model';
import { dummyData } from 'src/app/shared/dummy/user.dummy';
import { TableHeaderComponent } from '../../uikit/pages/table/components/table-header/table-header.component';
import { TableFooterComponent } from '../../uikit/pages/table/components/table-footer/table-footer.component';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-cmdachat',
  templateUrl: 'cmdachat.component.html',
  styleUrl: 'cmdachat.component.scss',
  imports: [AngularSvgIconModule, TableRowComponent, TableHeaderComponent, PopupComponent],
})
export class CmdAchatComponent {
  users = signal<User[]>([]);
  protected showPopUp: boolean = true;
  constructor() {
    this.users.set(dummyData);
  }
  onSearchChange(value: Event) {
    const input = value.target as HTMLInputElement;
  }
  onStatusChange(value: Event) {
    const selectElement = value.target as HTMLSelectElement;
  }

  onOrderChange(value: Event) {
    const selectElement = value.target as HTMLSelectElement;
  }
  public toggleUsers(checked: any) {
    this.users.update((users) => {
      return users.map((user) => {
        return { ...user, selected: checked };
      });
    });
  }

  filteredUsers() {
    return this.users();
  }
}
