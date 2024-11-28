import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalidasPendientesComponent } from './salidas-pendientes.component';

describe('SalidasPendientesComponent', () => {
  let component: SalidasPendientesComponent;
  let fixture: ComponentFixture<SalidasPendientesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalidasPendientesComponent]
    });
    fixture = TestBed.createComponent(SalidasPendientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
