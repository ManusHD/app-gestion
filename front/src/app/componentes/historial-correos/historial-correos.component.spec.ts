import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialCorreosComponent } from './historial-correos.component';

describe('HistorialCorreosComponent', () => {
  let component: HistorialCorreosComponent;
  let fixture: ComponentFixture<HistorialCorreosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistorialCorreosComponent]
    });
    fixture = TestBed.createComponent(HistorialCorreosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
