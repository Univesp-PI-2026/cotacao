import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TemaService } from './core/services/tema.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  constructor(private temaService: TemaService) {}

  ngOnInit(): void {
    this.temaService.inicializar();
  }
}
