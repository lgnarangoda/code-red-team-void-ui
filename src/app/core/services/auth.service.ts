import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<string | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() { }

  login(username: string): void {
    // TODO: Implement actual authentication logic
    this.currentUserSubject.next(username);
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): string | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
