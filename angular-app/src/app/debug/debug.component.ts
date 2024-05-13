import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [RouterModule, JsonPipe],
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss'
})
export class DebugComponent {
  routes: Routes;

  constructor(private router: Router) {
    this.routes = router.config;
  }
}