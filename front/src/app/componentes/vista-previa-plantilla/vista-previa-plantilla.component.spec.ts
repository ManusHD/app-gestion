import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaPreviaPlantillaComponent } from './vista-previa-plantilla.component';

describe('VistaPreviaPlantillaComponent', () => {
  let component: VistaPreviaPlantillaComponent;
  let fixture: ComponentFixture<VistaPreviaPlantillaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VistaPreviaPlantillaComponent]
    });
    fixture = TestBed.createComponent(VistaPreviaPlantillaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
