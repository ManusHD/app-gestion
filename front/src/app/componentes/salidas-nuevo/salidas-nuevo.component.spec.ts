import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalidasNuevoComponent } from './salidas-nuevo.component';

describe('SalidasNuevoComponent', () => {
  let component: SalidasNuevoComponent;
  let fixture: ComponentFixture<SalidasNuevoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalidasNuevoComponent]
    });
    fixture = TestBed.createComponent(SalidasNuevoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
