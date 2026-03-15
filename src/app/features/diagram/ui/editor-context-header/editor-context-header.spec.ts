import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComponentRef } from '@angular/core';

import { EditorContextHeader } from './editor-context-header';

describe('EditorContextHeader', () => {
  let component: EditorContextHeader;
  let componentRef: ComponentRef<EditorContextHeader>;
  let fixture: ComponentFixture<EditorContextHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorContextHeader],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorContextHeader);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('graphTitle', 'Test Graph');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
