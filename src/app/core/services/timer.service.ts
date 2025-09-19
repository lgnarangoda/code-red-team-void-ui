import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timeLeftSubject = new BehaviorSubject<number>(0);
  private isRunningSubject = new BehaviorSubject<boolean>(false);
  
  public timeLeft$ = this.timeLeftSubject.asObservable();
  public isRunning$ = this.isRunningSubject.asObservable();
  
  private timerInterval: any;

  constructor() { }

  startTimer(initialTime: number): void {
    this.timeLeftSubject.next(initialTime);
    this.isRunningSubject.next(true);
    
    this.timerInterval = setInterval(() => {
      const currentTime = this.timeLeftSubject.value;
      if (currentTime > 0) {
        this.timeLeftSubject.next(currentTime - 1);
      } else {
        this.stopTimer();
      }
    }, 1000);
  }

  stopTimer(): void {
    this.isRunningSubject.next(false);
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer(time: number): void {
    this.stopTimer();
    this.timeLeftSubject.next(time);
  }

  syncWithServer(serverTime: number): void {
    this.timeLeftSubject.next(serverTime);
  }
}
