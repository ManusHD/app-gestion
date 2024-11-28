import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalidasEnviadasComponent } from './salidas-enviadas.component';

describe('SalidasEnviadasComponent', () => {
  let component: SalidasEnviadasComponent;
  let fixture: ComponentFixture<SalidasEnviadasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalidasEnviadasComponent]
    });
    fixture = TestBed.createComponent(SalidasEnviadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
