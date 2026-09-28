import { Directive } from '@angular/core';

@Directive({
  selector: '[appSecondaryBtn]',
  standalone: true,
  host: { class: 'app-secondary-btn' },
})
export class SecondaryBtnDirective {}
