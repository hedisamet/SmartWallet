import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-page">
      <!-- Background blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="not-found-content animate-fade-in-up">
        <div class="error-code">404</div>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div class="not-found-actions">
          <a routerLink="/dashboard" class="btn btn--primary btn--lg" id="go-home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Go to Dashboard
          </a>
          <a routerLink="/auth/login" class="btn btn--outline btn--lg" id="go-login-404">Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--color-bg); position: relative; overflow: hidden; padding: 2rem;
    }
    .blob {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.12; pointer-events: none;
    }
    .blob-1 { width: 500px; height: 500px; background: var(--color-primary); top: -100px; right: -100px; }
    .blob-2 { width: 400px; height: 400px; background: var(--color-accent); bottom: -100px; left: -100px; }

    .not-found-content { text-align: center; z-index: 1; max-width: 480px; }
    .error-code {
      font-size: 8rem; font-weight: 900; letter-spacing: -0.06em;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      line-height: 1; margin-bottom: 1rem;
    }
    h1 { font-size: var(--font-size-2xl); margin-bottom: 1rem; }
    p  { color: var(--color-text-muted); font-size: var(--font-size-md); margin-bottom: 2rem; }
    .not-found-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  `]
})
export class NotFoundComponent {}
