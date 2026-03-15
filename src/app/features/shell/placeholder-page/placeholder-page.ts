import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-placeholder-page',
  template: `
    <main class="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <section class="text-center">
        <h1 class="text-2xl font-semibold tracking-tight">{{ title() }}</h1>
        <p class="mt-2 text-sm text-slate-400">Coming soon</p>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = toSignal(
    this.route.data.pipe(map((d) => (d.title as string) ?? '')),
    { initialValue: '' },
  );
}
