import { Directive } from '@angular/core';

@Directive({
  selector: '[appTertiaryBtn]',
  standalone: true,
  host: { class: 'app-tertiary-btn' },
})
export class TertiaryBtnDirective {}
