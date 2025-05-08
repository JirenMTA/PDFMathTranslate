import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenComponentComponent } from './ten-component.component';

describe('TenComponentComponent', () => {
  let component: TenComponentComponent;
  let fixture: ComponentFixture<TenComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
