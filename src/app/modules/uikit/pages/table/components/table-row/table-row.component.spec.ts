import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableContentComponent } from './table-content.component';
import { beforeEach, describe, it } from 'node:test';
import { expect } from '@playwright/test';

describe('TableContentComponent', () => {
  let component: TableContentComponent;
  let fixture: ComponentFixture<TableContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
