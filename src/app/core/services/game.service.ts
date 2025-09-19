import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { GameState } from '../models/game-state.model';

// This frontend integrates with the backend's REST + STOMP setup.
// - REST: issue commands (join lobby, move, exchange, pass)
// - STOMP over WebSocket: subscribe to /topic/game/{gameId} for GameStateDto broadcasts

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameStateSubject = new Subject<GameState>();
  private connectionStatusSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  connectionStatus$ = this.connectionStatusSubject.asObservable();
  private lastErrorSubject = new BehaviorSubject<string | null>(null);
  lastError$ = this.lastErrorSubject.asObservable();

  private ws: WebSocket | null = null;
  private stompConnected = false;
  private subscriptionId: string | null = null;
  private pendingPlacements: Record<string, { row: number; col: number; tileId: string; letter?: string }[]> = {};

  // Backend base URL. Adjust if your backend runs elsewhere.
  private readonly baseUrl = 'http://localhost:8080';

  constructor() { }

  // --- REST API ---
  async joinLobby(playerName: string): Promise<{ gameId: string }> {
    const res = await fetch(`${this.baseUrl}/lobby/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
    });
    if (!res.ok) throw new Error(`Join failed: ${res.status}`);
    return res.json();
  }

  private async post(path: string, body?: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
  }

  // Component currently calls sendPlaceTiles then sendSubmitMove; we buffer placements until submit.
  sendPlaceTiles(gameId: string, placements: { row: number; col: number; tileId: string; letter?: string }[]): void {
    this.pendingPlacements[gameId] = placements;
  }

  async sendSubmitMove(gameId: string): Promise<void> {
    const placements = this.pendingPlacements[gameId] || [];
    await this.post(`/game/${encodeURIComponent(gameId)}/move`, { placements });
    delete this.pendingPlacements[gameId];
  }

  async sendPass(gameId: string): Promise<void> {
    await this.post(`/game/${encodeURIComponent(gameId)}/pass`);
  }

  async sendExchange(gameId: string, tileIds: string[]): Promise<void> {
    await this.post(`/game/${encodeURIComponent(gameId)}/exchange`, { tileIds });
  }

  // Shuffle is a client-side UX action; backend usually doesn't need it. Keep as no-op.
  sendShuffle(gameId: string): void {
    // no-op
  }

  // --- STOMP over WebSocket subscription ---
  connectToGame(gameId: string): Observable<GameState> {
    try {
      this.connectionStatusSubject.next('connecting');
      // Connect native WebSocket to Spring's STOMP endpoint
      this.ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws`, ['v12.stomp', 'v11.stomp', 'v10.stomp']);

      this.ws.onopen = () => {
        // Send CONNECT frame
        this.sendStompFrame('CONNECT', {
          'accept-version': '1.1,1.2',
          'heart-beat': '10000,10000'
        });
      };

      this.ws.onmessage = (event) => {
        const data: string = event.data;
        // Heartbeats can be just "\n"; ignore
        if (data === '\n' || data === '' || data === '\r\n') return;

        const frame = this.parseStompFrame(data);
        if (!frame) return;

        switch (frame.command) {
          case 'CONNECTED':
            this.stompConnected = true;
            this.connectionStatusSubject.next('connected');
            // Subscribe to topic
            this.subscriptionId = `sub-${gameId}`;
            this.sendStompFrame('SUBSCRIBE', {
              id: this.subscriptionId,
              destination: `/topic/game/${gameId}`
            });
            break;
          case 'MESSAGE':
            // Body is GameStateDto JSON
            if (frame.body) {
              try {
                const snapshot: GameState = JSON.parse(frame.body);
                this.gameStateSubject.next(snapshot);
              } catch (e) {
                this.lastErrorSubject.next('Malformed game update');
              }
            }
            break;
          case 'ERROR':
            this.lastErrorSubject.next(frame.body || 'STOMP error');
            this.connectionStatusSubject.next('error');
            break;
        }
      };

      this.ws.onerror = () => {
        this.connectionStatusSubject.next('error');
        this.lastErrorSubject.next('WebSocket error');
      };

      this.ws.onclose = () => {
        this.connectionStatusSubject.next('disconnected');
        this.stompConnected = false;
        this.ws = null;
      };
    } catch (err: any) {
      this.connectionStatusSubject.next('error');
      this.lastErrorSubject.next(err?.message || 'Failed to connect');
    }

    return this.gameStateSubject.asObservable();
  }

  disconnect(): void {
    try {
      if (this.ws && this.stompConnected) {
        if (this.subscriptionId) {
          this.sendStompFrame('UNSUBSCRIBE', { id: this.subscriptionId });
          this.subscriptionId = null;
        }
        this.sendStompFrame('DISCONNECT', {});
      }
    } finally {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.stompConnected = false;
    }
  }

  // --- Minimal STOMP helpers ---
  private sendStompFrame(command: string, headers: Record<string, string>): void {
    if (!this.ws) return;
    const headerLines = Object.entries(headers)
      .map(([k, v]) => `${k}:${v}`)
      .join('\n');
    const frame = `${command}\n${headerLines}\n\n\u0000`;
    this.ws.send(frame);
  }

  private parseStompFrame(raw: string): { command: string; headers: Record<string, string>; body: string } | null {
    // STOMP frames may come concatenated if buffering occurs. Handle first frame only.
    const nullIdx = raw.indexOf('\u0000');
    const chunk = nullIdx >= 0 ? raw.substring(0, nullIdx) : raw;
    const sepIdx = chunk.indexOf('\n\n');
    if (sepIdx < 0) return null;
    const headerPart = chunk.substring(0, sepIdx);
    const body = chunk.substring(sepIdx + 2);
    const lines = headerPart.split('\n');
    const command = lines[0];
    const headers: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const colon = line.indexOf(':');
      if (colon > 0) {
        const key = line.substring(0, colon);
        const value = line.substring(colon + 1);
        headers[key] = value;
      }
    }
    return { command, headers, body };
  }
}
