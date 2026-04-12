import { Injectable, inject, signal, effect } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { Notification } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private auth = inject(AuthService);
  private hubConnection?: signalR.HubConnection;
  
  // Public signal for notifications
  newNotification = signal<Notification | null>(null);
  connectionStatus = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');

  constructor() {
    // Reconnect if user changes
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.startConnection();
      } else {
        this.stopConnection();
      }
    });
  }

  private startConnection() {
    if (this.hubConnection) return;

    const token = this.auth.getToken();
    if (!token) return;

    this.connectionStatus.set('connecting');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.split('/api')[0]}/hubs/notifications`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.connectionStatus.set('connected');
        console.log('SignalR Connected');
      })
      .catch(err => {
        this.connectionStatus.set('disconnected');
        console.error('SignalR Connection Error: ', err);
      });

    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      this.newNotification.set(notification);
    });
  }

  private stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = undefined;
      this.connectionStatus.set('disconnected');
    }
  }
}
