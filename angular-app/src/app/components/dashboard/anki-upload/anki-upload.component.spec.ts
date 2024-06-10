import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnkiUploadComponent } from './anki-upload.component';

describe('AnkiUploadComponent', () => {
  let component: AnkiUploadComponent;
  let fixture: ComponentFixture<AnkiUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnkiUploadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnkiUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
