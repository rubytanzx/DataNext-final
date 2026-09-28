import { Directive } from '@angular/core';

@Directive({
  selector: '[appPrimaryBtn]',
  standalone: true,
  host: { class: 'app-primary-btn' },
})
export class PrimaryBtnDirective {}
