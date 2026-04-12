import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationDataService {
  private http = inject(HttpClient);

  getNotifications(count = 20): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications?count=${count}`);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/notifications/${id}/read`, {});
  }
}
