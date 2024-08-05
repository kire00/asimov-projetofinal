import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroBaixasComponent } from './registro-baixas.component';

describe('RegistroBaixasComponent', () => {
  let component: RegistroBaixasComponent;
  let fixture: ComponentFixture<RegistroBaixasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistroBaixasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistroBaixasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
