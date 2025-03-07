import { Directive, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

@Directive({
  selector: '[appConfirm]'
})
export class ConfirmDirective {
  @Input('appConfirm') confirmMessage?: string;
  @Output() confirmed = new EventEmitter<void>();

  constructor(private confirmService: ConfirmDialogService) {}

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.confirmService.confirm(this.confirmMessage || '¿Estás seguro?')
      .subscribe(result => {
        if (result) {
          // Emite el evento para que se ejecute la acción original.
          this.confirmed.emit();
        }
      });
  }
}
