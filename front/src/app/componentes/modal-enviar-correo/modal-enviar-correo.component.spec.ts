import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEnviarCorreoComponent } from './modal-enviar-correo.component';

describe('ModalEnviarCorreoComponent', () => {
  let component: ModalEnviarCorreoComponent;
  let fixture: ComponentFixture<ModalEnviarCorreoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalEnviarCorreoComponent]
    });
    fixture = TestBed.createComponent(ModalEnviarCorreoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
