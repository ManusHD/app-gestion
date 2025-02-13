import { Component } from '@angular/core';

@Component({
  selector: 'app-panel-lateral',
  templateUrl: './panel-lateral.component.html',
  styleUrls: ['./panel-lateral.component.css']
})
export class PanelLateralComponent {
  isActive(route: string): string {
    if (window.location.pathname === route){
      return 'summary-active';
    }

    return '';
  }
}
