import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalNav } from './features/shell/global-nav/global-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalNav],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
