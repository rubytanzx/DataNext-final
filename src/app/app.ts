import { Component, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavComponent } from './layout/nav/nav.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly title = 'DataNext — ERDI Intelligence Hub';

  readonly hideNav = signal(false);

  constructor(router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const root = router.routerState.snapshot.root;
        let child = root.firstChild;
        while (child?.firstChild) child = child.firstChild;
        this.hideNav.set(!!child?.data?.['hideNav']);
      }
    });
  }
}
