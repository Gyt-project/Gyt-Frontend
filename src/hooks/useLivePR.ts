'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LiveClient,
  ChatPayload,
  CursorPayload,
  DraftPayload,
  VerdictProposedPayload,
  VerdictFinalizedPayload,
  UserInfo,
} from '@/lib/live-client';

export interface CursorPosition {
  userId: number;
  file: string;
  line: number;
}

export interface DraftComment {
  userId: number;
  file: string;
  line: number;
  body: string;
}

/** The active collective verdict proposal visible to all participants. */
export interface ActiveProposal {
  proposalId: string;
  proposerId: number;
  proposerName: string;
  decision: 'approve' | 'request_changes' | 'comment';
  body: string;
  totalNeeded: number;
  acceptedCount: number;
}

/** A finalised collective verdict (stored for display after resolution). */
export interface FinalizedVerdict {
  proposalId: string;
  decision: 'approve' | 'request_changes' | 'comment';
  body: string;
  reviewId: number;
}

export interface LiveState {
  /** True once the auth handshake succeeds */
  connected: boolean;
  /** The current user's numeric DB ID (set once auth_ok is received) */
  myUserId: number | null;
  /** Users currently in the lobby */
  participants: UserInfo[];
  /** Cursor positions keyed by userId */
  cursors: Record<number, CursorPosition>;
  /** Active draft comments keyed by `${userId}:${file}:${line}` */
  drafts: Record<string, DraftComment>;
  /** Persistent chat messages (oldest first) */
  chat: ChatPayload[];
  /** Active collective verdict proposal (null when idle) */
  proposal: ActiveProposal | null;
  /** Finalised collective reviews submitted in this session */
  verdicts: FinalizedVerdict[];
  /** True when the creator has closed the session */
  sessionClosed: boolean;
}

export interface UseLivePRReturn extends LiveState {
  sendCursor: (file: string, line: number) => void;
  sendDraft: (file: string, line: number, body: string) => void;
  sendChat: (body: string, parentId?: number) => void;
  /** Propose a collective verdict — all participants must accept. */
  proposeVerdict: (
    decision: 'approve' | 'request_changes' | 'comment',
    body: string
  ) => void;
  /** Accept the current collective proposal. */
  acceptVerdict: (proposalId: string) => void;
  /** Reject the current collective proposal (cancels it for everyone). */
  rejectVerdict: (proposalId: string) => void;
  disconnect: () => void;
}

/**
 * useLivePR — React hook that manages a Live PR WebSocket session.
 *
 * @param sessionId  The numeric LiveSession.ID from the Live API
 * @param token      JWT access token (from AuthContext)
 * @param baseUrl    Live API base URL (defaults to NEXT_PUBLIC_LIVE_API_URL)
 */
export function useLivePR(
  sessionId: number | null,
  token: string | null,
  baseUrl?: string
): UseLivePRReturn {
  // REST calls go through the Next.js proxy (/live/...) — no CORS needed.
  const resolvedBaseUrl = baseUrl ?? '';
  // WebSocket must connect directly to the live server (Next.js can't proxy WS).
  const wsBaseUrl =
    baseUrl ??
    process.env.NEXT_PUBLIC_LIVE_API_URL?.replace(/^http/, 'ws') ??
    'ws://localhost:8090';

  const clientRef = useRef<LiveClient | null>(null);

  const [state, setState] = useState<LiveState>({
    connected: false,
    myUserId: null,
    participants: [],
    cursors: {},
    drafts: {},
    chat: [],
    proposal: null,
    verdicts: [],
    sessionClosed: false,
  });

  useEffect(() => {
    if (!sessionId || !token) return;

    const client = new LiveClient({
      baseUrl: resolvedBaseUrl,
      wsBaseUrl,
      sessionId,
      token,
    });
    clientRef.current = client;

    // ── Auth & presence ───────────────────────────────────────────────────────
    client.on('auth_ok', (p) => {
      setState((s) => ({ ...s, connected: true, myUserId: p.user.id }));
    });

    client.on('auth_fail', () => {
      setState((s) => ({ ...s, connected: false }));
    });

    client.on('presence', (p) => {
      setState((s) => ({ ...s, participants: p.users }));
    });

    client.on('user_joined', ({ user }) => {
      setState((s) => ({
        ...s,
        participants: s.participants.some((u) => u.id === user.id)
          ? s.participants
          : [...s.participants, user],
      }));
    });

    client.on('user_left', ({ userId }) => {
      setState((s) => ({
        ...s,
        participants: s.participants.filter((u) => u.id !== userId),
        cursors: Object.fromEntries(
          Object.entries(s.cursors).filter(([k]) => parseInt(k) !== userId)
        ),
      }));
    });

    // ── Cursors ───────────────────────────────────────────────────────────────
    client.on('cursor', (payload: CursorPayload) => {
      setState((s) => ({
        ...s,
        cursors: { ...s.cursors, [payload.userId]: payload },
      }));
    });

    // ── Drafts ────────────────────────────────────────────────────────────────
    client.on('draft', (payload: DraftPayload) => {
      const key = `${payload.userId}:${payload.file}:${payload.line}`;
      setState((s) => {
        if (payload.body === '') {
          // Empty body = delete the draft
          const { [key]: _, ...rest } = s.drafts;
          return { ...s, drafts: rest };
        }
        return { ...s, drafts: { ...s.drafts, [key]: payload } };
      });
    });

    // ── Chat ──────────────────────────────────────────────────────────────────
    client.on('chat', (payload: ChatPayload) => {
      setState((s) => ({
        ...s,
        chat: [...s.chat, payload],
      }));
    });

    // Replay history sent once on (re-)join so late participants catch up.
    client.on('chat_history', (p) => {
      setState((s) => ({ ...s, chat: p.messages }));
    });

    // ── Verdict proposal ──────────────────────────────────────────────────────

    client.on('verdict_proposed', (p: VerdictProposedPayload) => {
      setState((s) => ({ ...s, proposal: p }));
    });

    client.on('verdict_vote_update', (p) => {
      setState((s) => ({
        ...s,
        proposal: s.proposal
          ? { ...s.proposal, acceptedCount: p.acceptedCount, totalNeeded: p.totalNeeded }
          : null,
      }));
    });

    client.on('verdict_rejected', () => {
      setState((s) => ({ ...s, proposal: null }));
    });

    client.on('verdict_finalized', (p: VerdictFinalizedPayload) => {
      setState((s) => ({
        ...s,
        proposal: null,
        verdicts: [
          ...s.verdicts,
          { proposalId: p.proposalId, decision: p.decision, body: p.body, reviewId: p.reviewId },
        ],
      }));
    });

    // ── Session closed ────────────────────────────────────────────────────────
    client.on('session_closed', () => {
      setState((s) => ({ ...s, sessionClosed: true, connected: false }));
    });

    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token, wsBaseUrl]);

  // ── Sender helpers ────────────────────────────────────────────────────────

  const sendCursor = useCallback((file: string, line: number) => {
    clientRef.current?.send({ type: 'cursor', file, line });
  }, []);

  const sendDraft = useCallback((file: string, line: number, body: string) => {
    clientRef.current?.send({ type: 'draft', file, line, body });
  }, []);

  const sendChat = useCallback((body: string, parentId?: number) => {
    if (body.trim()) {
      clientRef.current?.send({ type: 'chat', body, parentId });
    }
  }, []);

  const proposeVerdict = useCallback(
    (decision: 'approve' | 'request_changes' | 'comment', body: string) => {
      clientRef.current?.send({ type: 'verdict_propose', decision, body });
    },
    []
  );

  const acceptVerdict = useCallback((proposalId: string) => {
    clientRef.current?.send({ type: 'verdict_accept', proposalId });
  }, []);

  const rejectVerdict = useCallback((proposalId: string) => {
    clientRef.current?.send({ type: 'verdict_reject', proposalId });
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  return { ...state, sendCursor, sendDraft, sendChat, proposeVerdict, acceptVerdict, rejectVerdict, disconnect };
}
