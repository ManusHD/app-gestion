import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesCorreosComponent } from './detalles-correos.component';

describe('DetallesCorreosComponent', () => {
  let component: DetallesCorreosComponent;
  let fixture: ComponentFixture<DetallesCorreosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetallesCorreosComponent]
    });
    fixture = TestBed.createComponent(DetallesCorreosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
