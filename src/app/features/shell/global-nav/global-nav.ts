import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-global-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './global-nav.html',
  styleUrl: './global-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalNav {
  protected readonly navLinks = [
    { path: '/', label: 'Home', exact: true },
    { path: '/graphs', label: 'Graphs', exact: false },
    { path: '/diagnose', label: 'Diagnose', exact: false },
    { path: '/templates', label: 'Templates', exact: false },
  ];
}
