import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

type BottomNavLink = {
  path: '/today' | '/diagnose' | '/map' | '/garage';
  label: string;
};

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  private readonly router = inject(Router);

  protected readonly navLinks: BottomNavLink[] = [
    { path: '/today', label: 'Today' },
    { path: '/diagnose', label: 'Diagnose' },
    { path: '/map', label: 'Map' },
    { path: '/garage', label: 'Garage' },
  ];

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected isActive(path: BottomNavLink['path']): boolean {
    const url = this.currentUrl();

    if (path === '/map') {
      return (
        url === '/map' || url.startsWith('/map/') || url.startsWith('/graphs/')
      );
    }

    if (path === '/garage') {
      return url === '/garage' || url === '/graphs';
    }

    return url === path || url.startsWith(`${path}/`);
  }
}
