import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { GraphEditorPage } from './graph-editor-page';

describe('GraphEditorPage', () => {
  let component: GraphEditorPage;
  let fixture: ComponentFixture<GraphEditorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphEditorPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
            paramMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphEditorPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
