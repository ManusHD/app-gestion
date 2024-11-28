import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabeceraSalidasComponent } from './cabecera-salidas.component';

describe('CabeceraSalidasComponent', () => {
  let component: CabeceraSalidasComponent;
  let fixture: ComponentFixture<CabeceraSalidasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CabeceraSalidasComponent]
    });
    fixture = TestBed.createComponent(CabeceraSalidasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
