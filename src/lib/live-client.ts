/**
 * LiveClient — typed WebSocket client for the Live PR API.
 *
 * Features
 * - Event-driven API (on / off / once)
 * - Auth handshake as first message
 * - Automatic exponential-backoff reconnect
 * - Typed message payloads matching the Go server's event structs
 */

// ─── Event types ─────────────────────────────────────────────────────────────

export type LiveEventType =
  | 'auth_ok'
  | 'auth_fail'
  | 'presence'
  | 'user_joined'
  | 'user_left'
  | 'cursor'
  | 'draft'
  | 'chat'
  | 'chat_history'
  // Collective verdict proposal
  | 'verdict_proposed'
  | 'verdict_vote_update'
  | 'verdict_rejected'
  | 'verdict_finalized'
  | 'session_closed';

export interface UserInfo {
  id: number;
  username: string;
  avatar?: string;
}

export interface AuthOKPayload {
  sessionId: number;
  user: UserInfo;
}

export interface PresencePayload {
  sessionId: number;
  users: UserInfo[];
}

export interface CursorPayload {
  userId: number;
  file: string;
  line: number;
}

export interface DraftPayload {
  userId: number;
  file: string;
  line: number;
  body: string;
}

export interface ChatPayload {
  id: number;
  userId: number;
  username: string;
  body: string;
  parentId?: number; // set when this is a reply
  createdAt: string;
}

export interface VerdictProposedPayload {
  proposalId: string;
  proposerId: number;
  proposerName: string;
  decision: 'approve' | 'request_changes' | 'comment';
  body: string;
  totalNeeded: number;
  acceptedCount: number;
}

export interface VerdictVoteUpdatePayload {
  proposalId: string;
  userId: number;
  username: string;
  acceptedCount: number;
  totalNeeded: number;
}

export interface VerdictRejectedPayload {
  proposalId: string;
  userId: number;
  username: string;
}

export interface VerdictFinalizedPayload {
  proposalId: string;
  decision: 'approve' | 'request_changes' | 'comment';
  body: string;
  reviewId: number;
}

export type LiveEventPayloadMap = {
  auth_ok: AuthOKPayload;
  auth_fail: string;
  presence: PresencePayload;
  user_joined: { user: UserInfo };
  user_left: { userId: number };
  cursor: CursorPayload;
  draft: DraftPayload;
  chat: ChatPayload;
  chat_history: { messages: ChatPayload[] };
  verdict_proposed: VerdictProposedPayload;
  verdict_vote_update: VerdictVoteUpdatePayload;
  verdict_rejected: VerdictRejectedPayload;
  verdict_finalized: VerdictFinalizedPayload;
  session_closed: undefined;
};

// ─── Outgoing message helpers ─────────────────────────────────────────────────

export interface SendCursor { type: 'cursor'; file: string; line: number }
export interface SendDraft  { type: 'draft';  file: string; line: number; body: string }
export interface SendChat   { type: 'chat';   body: string; parentId?: number }
// Collective review — propose a verdict; others vote to accept/reject
export interface SendVerdictPropose {
  type: 'verdict_propose';
  decision: 'approve' | 'request_changes' | 'comment';
  body: string;
}
export interface SendVerdictAccept {
  type: 'verdict_accept';
  proposalId: string;
}
export interface SendVerdictReject {
  type: 'verdict_reject';
  proposalId: string;
}
export type LiveOutMessage = SendCursor | SendDraft | SendChat | SendVerdictPropose | SendVerdictAccept | SendVerdictReject;

// ─── Client ──────────────────────────────────────────────────────────────────

type EventHandler<T extends LiveEventType> = (payload: LiveEventPayloadMap[T]) => void;

interface LiveClientOptions {
  /** Base URL for REST calls. Can be a relative path (e.g. "") when using a Next.js proxy. */
  baseUrl: string;
  /**
   * Base URL for the WebSocket connection.
   * Defaults to `baseUrl` but can be overridden when REST goes through a proxy
   * and WebSocket must connect directly to the live server.
   * e.g. "ws://localhost:8090"
   */
  wsBaseUrl?: string;
  sessionId: number;
  /** JWT access token */
  token: string;
  /** Maximum reconnect attempts before giving up (default: 10) */
  maxRetries?: number;
}

export class LiveClient {
  private readonly baseUrl: string;
  private readonly wsBaseUrl: string;
  private readonly sessionId: number;
  private readonly token: string;
  private readonly maxRetries: number;

  private ws: WebSocket | null = null;
  private retries = 0;
  private closed = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<string, Set<(payload: any) => void>> = new Map();

  constructor(opts: LiveClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    const rawWs = (opts.wsBaseUrl ?? opts.baseUrl).replace(/\/$/, '');
    // Ensure the WebSocket base uses ws:// or wss://.
    this.wsBaseUrl = rawWs.replace(/^http/, 'ws');
    this.sessionId = opts.sessionId;
    this.token = opts.token;
    this.maxRetries = opts.maxRetries ?? 10;
  }

  /** Connect to the WebSocket server and start the auth handshake. */
  connect(): void {
    if (this.closed) return;
    const url = `${this.wsBaseUrl}/live/ws?session=${this.sessionId}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.retries = 0;
      // First message must be the auth token.
      ws.send(JSON.stringify({ type: 'auth', token: this.token }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as { type: string; payload?: unknown };
        const listeners = this.handlers.get(msg.type);
        if (listeners) {
          listeners.forEach((fn) => fn(msg.payload));
        }
        // Universal '*' listeners
        const wildcards = this.handlers.get('*');
        if (wildcards) {
          wildcards.forEach((fn) => fn(msg));
        }
      } catch {
        // malformed message — ignore
      }
    };

    ws.onerror = () => {
      // onclose fires after onerror, so reconnect logic lives there.
    };

    ws.onclose = () => {
      if (this.closed) return;
      if (this.retries >= this.maxRetries) {
        console.warn('[live] max reconnect attempts reached');
        return;
      }
      const delay = Math.min(1000 * 2 ** this.retries, 30_000);
      this.retries++;
      setTimeout(() => this.connect(), delay);
    };
  }

  /** Gracefully close the connection and stop reconnecting. */
  disconnect(): void {
    this.closed = true;
    this.ws?.close(1000);
    this.ws = null;
  }

  /** Send a typed event message to the server. */
  send(msg: LiveOutMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /** Register a persistent handler for event type T. */
  on<T extends LiveEventType>(type: T, handler: EventHandler<T>): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler<LiveEventType>);
  }

  /** Unregister a handler. */
  off<T extends LiveEventType>(type: T, handler: EventHandler<T>): void {
    this.handlers.get(type)?.delete(handler as EventHandler<LiveEventType>);
  }

  /** Register a one-time handler that auto-removes after the first call. */
  once<T extends LiveEventType>(type: T, handler: EventHandler<T>): void {
    const wrapper: EventHandler<T> = (payload) => {
      handler(payload);
      this.off(type, wrapper);
    };
    this.on(type, wrapper);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
