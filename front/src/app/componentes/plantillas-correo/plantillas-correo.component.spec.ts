import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantillasCorreoComponent } from './plantillas-correo.component';

describe('PlantillasCorreoComponent', () => {
  let component: PlantillasCorreoComponent;
  let fixture: ComponentFixture<PlantillasCorreoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlantillasCorreoComponent]
    });
    fixture = TestBed.createComponent(PlantillasCorreoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
