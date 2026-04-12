import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <!-- Animated background blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <!-- Brand header -->
      <header class="auth-brand">
        <div class="brand-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#g1)"/>
            <path d="M8 10l10 16 10-16" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 18c2 2 8 2 10 0" stroke="#00D4AA" stroke-width="2" stroke-linecap="round"/>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6C63FF"/>
                <stop offset="1" stop-color="#8B85FF"/>
              </linearGradient>
            </defs>
          </svg>
          <span class="brand-name">VaultFlow</span>
        </div>
      </header>

      <!-- Auth card -->
      <main class="auth-content">
        <div class="auth-card glass animate-fade-in-up">
          <router-outlet />
        </div>
      </main>

      <footer class="auth-footer">
        <p>© 2026 VaultFlow · Secure Digital Finance</p>
      </footer>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
      background: var(--color-bg);
    }

    /* Floating gradient blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.18;
      pointer-events: none;
    }
    .blob-1 {
      width: 500px; height: 500px;
      background: var(--color-primary);
      top: -150px; left: -100px;
      animation: blobFloat1 12s ease-in-out infinite alternate;
    }
    .blob-2 {
      width: 400px; height: 400px;
      background: var(--color-accent);
      bottom: -100px; right: -80px;
      animation: blobFloat2 15s ease-in-out infinite alternate;
    }
    .blob-3 {
      width: 300px; height: 300px;
      background: #FF5A7E;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      animation: blobFloat3 10s ease-in-out infinite alternate;
      opacity: 0.08;
    }
    @keyframes blobFloat1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px, 60px) scale(1.1); } }
    @keyframes blobFloat2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px, -40px) scale(1.15); } }
    @keyframes blobFloat3 { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-50%) scale(1.3); } }

    .auth-brand {
      padding: 2rem 0 0;
      z-index: 1;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-name {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.03em;
    }

    .auth-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 2rem 1rem;
      z-index: 1;
    }
    .auth-card {
      width: 100%;
      max-width: 460px;
      border-radius: var(--radius-2xl);
      padding: 2.5rem;
    }

    .auth-footer {
      padding: 1.5rem;
      z-index: 1;
      p {
        font-size: var(--font-size-xs);
        color: var(--color-text-faint);
        text-align: center;
      }
    }

    @media (max-width: 480px) {
      .auth-card { padding: 1.75rem 1.25rem; }
    }
  `]
})
export class AuthLayoutComponent {}
