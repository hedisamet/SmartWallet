import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent }  from '../sidebar/sidebar.component';
import { TopbarComponent }   from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar
        [collapsed]="sidebarCollapsed()"
        (toggleCollapse)="toggleSidebar()"
      />
      <div class="shell-main">
        <app-topbar (menuToggle)="toggleSidebar()" />
        <main class="shell-content" id="main-content">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile overlay -->
      @if (!sidebarCollapsed() && isMobile()) {
        <div class="sidebar-overlay" (click)="toggleSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      margin-left: 260px;
      transition: margin-left var(--transition-base);
    }

    .shell.sidebar-collapsed .shell-main {
      margin-left: 72px;
    }

    .shell-content {
      flex: 1;
      padding: 2rem;
      max-width: 1280px;
      width: 100%;
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: calc(var(--z-sticky) - 1);
    }

    @media (max-width: 768px) {
      .shell-main {
        margin-left: 0 !important;
      }
      .shell-content {
        padding: 1.25rem;
      }
    }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
  isMobile         = signal(window.innerWidth <= 768);

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth <= 768);
    if (this.isMobile()) this.sidebarCollapsed.set(true);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
}
