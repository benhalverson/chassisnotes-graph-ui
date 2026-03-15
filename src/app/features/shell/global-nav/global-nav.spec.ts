import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GlobalNav } from './global-nav';

describe('GlobalNav', () => {
  let component: GlobalNav;
  let fixture: ComponentFixture<GlobalNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalNav],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a nav with aria-label', () => {
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('should render the brand link with an accessible name', () => {
    const brandLink: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a[aria-label="ChassisNotes Relationships"]',
    );
    expect(brandLink).toBeTruthy();
  });

  it('should render all nav links', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    );
    const labels = links.map((l) => l.textContent?.trim());
    expect(labels).toContain('Graphs');
    expect(labels).toContain('Diagnose');
    expect(labels).toContain('Templates');
  });

  it('should have 3 nav links plus the brand link', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    );
    expect(links.length).toBe(4); // brand + 3 nav links
  });
});
