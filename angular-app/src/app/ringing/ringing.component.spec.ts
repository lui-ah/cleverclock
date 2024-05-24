import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RingingComponent } from './ringing.component';

describe('RingingComponent', () => {
  let component: RingingComponent;
  let fixture: ComponentFixture<RingingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RingingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RingingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
