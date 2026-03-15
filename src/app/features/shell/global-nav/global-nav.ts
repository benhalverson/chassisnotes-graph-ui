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
    { path: '/graphs', label: 'Graphs', exact: true },
    { path: '/diagnose', label: 'Diagnose', exact: false },
    { path: '/templates', label: 'Templates', exact: false },
  ];
}
