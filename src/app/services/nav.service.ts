import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NavService {
  readonly collapsed = signal<boolean>(false);
  readonly chatSearch = signal<string>('');

  toggle() {
    this.collapsed.update(v => !v);
  }

  collapse() {
    this.collapsed.set(true);
  }

  expand() {
    this.collapsed.set(false);
  }
}
