'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import {
  Users, MessageSquare, FileText, Radio, CheckCircle2, AlertCircle,
  PlusCircle, LogIn, ArrowLeft, X, Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { GET_PULL_REQUEST, GET_REPOSITORY, GET_PR_DIFF } from '@/graphql/queries';
import { PullRequest, Repository, CompareResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useLivePR } from '@/hooks/useLivePR';
import ChatPanel from '@/components/live/ChatPanel';
import PresenceBar from '@/components/live/PresenceBar';
import RepoLayout from '@/components/layout/RepoLayout';
import InlineDiffViewer from '@/components/repo/InlineDiffViewer';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveSession {
  ID: number;
  Title: string;
  CreatorID: number;
  Closed: boolean;
  CreatedAt: string;
}

// ─── Live API helpers ─────────────────────────────────────────────────────────

// REST calls go through the Next.js proxy rewrite (/live/...) — no CORS needed.
// WebSocket is handled separately in useLivePR (direct to NEXT_PUBLIC_LIVE_API_URL).
const LIVE_API = '';

async function fetchSessions(prId: string, token: string): Promise<LiveSession[]> {
  const res = await fetch(`${LIVE_API}/live/pr/${prId}/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

async function createSession(
  owner: string,
  repo: string,
  number: number,
  token: string,
  title: string
): Promise<LiveSession> {
  const res = await fetch(`${LIVE_API}/live/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ owner, repo, number, title }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

async function closeSession(sessionId: number, token: string): Promise<void> {
  await fetch(`${LIVE_API}/live/sessions/${sessionId}/close`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Verdict badge ────────────────────────────────────────────────────────────

function VerdictIcon({ decision }: { decision: string }) {
  if (decision === 'approve') return <CheckCircle2 size={14} className="text-[#2ea043]" />;
  if (decision === 'request_changes') return <AlertCircle size={14} className="text-[#da3633]" />;
  return <MessageSquare size={14} className="text-fg-muted" />;
}

// ─── Lobby view ───────────────────────────────────────────────────────────────

function LobbyView({
  session,
  pr,
  username,
  repo,
  prNumber,
  token,
  prAuthorUsername,
  currentUsername,
  currentUser,
  onClose,
}: {
  session: LiveSession;
  pr: PullRequest;
  username: string;
  repo: string;
  prNumber: string;
  token: string;
  prAuthorUsername: string;
  currentUsername: string;
  currentUser: import('@/types').User | null;
  onClose: () => void;
}) {
  const live = useLivePR(session.ID, token);
  const myUserId = live.myUserId ?? 0;
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'review'>('chat');
  const [verdictDraft, setVerdictDraft] = useState('');
  const [verdictDecision, setVerdictDecision] = useState<'approve' | 'request_changes' | 'comment'>('comment');

  const { data: diffData } = useQuery<{ getPullRequestDiff: CompareResponse }>(GET_PR_DIFF, {
    variables: { owner: username, repo, number: parseInt(prNumber, 10) },
  });
  const diff = diffData?.getPullRequestDiff;

  const handleProposeVerdict = useCallback(() => {
    live.proposeVerdict(verdictDecision, verdictDraft);
    setVerdictDraft('');
  }, [live, verdictDecision, verdictDraft]);

  if (live.sessionClosed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <X size={40} className="text-fg-muted" />
        <p className="text-lg font-semibold text-fg">This lobby has been closed</p>
        <Link href={`/${username}/${repo}/pulls/${prNumber}`}>
          <Button variant="secondary" size="sm">
            <ArrowLeft size={13} className="mr-1.5" /> Back to PR
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-[#2ea043]" />
          <span className="font-semibold text-fg">{session.Title}</span>
          <span className="text-xs text-fg-muted">#{pr.number} — {pr.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <PresenceBar participants={live.participants} connected={live.connected} />
          {session.CreatorID === myUserId && (
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await closeSession(session.ID, token);
                onClose();
              }}
            >
              Close lobby
            </Button>
          )}
          <Link href={`/${username}/${repo}/pulls/${prNumber}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={13} className="mr-1" /> Back to PR
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4">
        {(
          [
            { id: 'chat', label: 'Chat', icon: <MessageSquare size={13} /> },
            { id: 'files', label: `Files changed${diff ? ` (${diff.filesChanged})` : ''}`, icon: <FileText size={13} /> },
            { id: 'review', label: 'Submit Review', icon: <CheckCircle2 size={13} /> },
          ] as const
        ).map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-1.5 pb-2 text-sm border-b-2 -mb-px transition-colors',
              activeTab === id
                ? 'border-accent-emphasis text-fg font-semibold'
                : 'border-transparent text-fg-muted hover:text-fg',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Chat panel */}
          <div className="md:col-span-2 flex flex-col min-h-[400px]">
            <ChatPanel
              messages={live.chat}
              currentUserId={myUserId}
              participants={live.participants}
              onSend={live.sendChat}
              className="flex-1"
            />
          </div>

          {/* Side panel: verdicts + cursors */}
          <div className="flex flex-col gap-3">
            {/* Verdicts submitted in this session */}
            {live.verdicts.length > 0 && (
              <div className="border border-border rounded-md p-3">
                <p className="text-xs font-semibold text-fg mb-2">Reviews submitted in this session</p>
                <div className="space-y-2">
                  {live.verdicts.map((v, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <VerdictIcon decision={v.decision} />
                      <div>
                        <span className="text-fg-muted ml-1 capitalize">{v.decision.replace(/_/g, ' ')}</span>
                        {v.body && (
                          <p className="text-fg-muted mt-0.5 line-clamp-2">{v.body}</p>
                        )}
                        <p className="text-fg-muted/60 mt-0.5">Review #{v.reviewId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active cursors */}
            {Object.keys(live.cursors).length > 0 && (
              <div className="border border-border rounded-md p-3">
                <p className="text-xs font-semibold text-fg mb-2">Reviewing now</p>
                <div className="space-y-1">
                  {Object.values(live.cursors).map((c) => {
                    const p = live.participants.find((u) => u.id === c.userId);
                    return (
                      <div key={c.userId} className="flex items-center gap-1.5 text-xs text-fg-muted">
                        <span className="w-2 h-2 rounded-full bg-[#2ea043] inline-block" />
                        <span className="font-medium text-fg">{p?.username ?? `User ${c.userId}`}</span>
                        <span>{c.file}</span>
                        <span>:{c.line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="flex flex-col gap-4">
          {!diff ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 text-xs text-fg-muted pb-1 border-b border-border">
                <span className="font-medium text-fg">{diff.filesChanged} file{diff.filesChanged !== 1 ? 's' : ''} changed</span>
                <span className="text-[#2ea043]">+{diff.totalAdditions}</span>
                <span className="text-[#da3633]">−{diff.totalDeletions}</span>
                <span className="ml-auto flex items-center gap-1 text-[#2ea043] text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] inline-block" />
                  Drafts are shared live with all participants
                </span>
              </div>

              <InlineDiffViewer
                files={diff.files}
                patch={diff.patch}
                showStats={false}
                currentUser={currentUser}
                inlineComments={Object.values(live.drafts).map((d) => {
                  const participant = live.participants.find((p) => p.id === d.userId);
                  return {
                    id: `draft-${d.userId}-${d.file}-${d.line}`,
                    body: d.body,
                    path: d.file,
                    line: d.line,
                    author: {
                      uuid: String(d.userId),
                      username: participant?.username ?? `User ${d.userId}`,
                      displayName: participant?.username ?? '',
                      email: '',
                      avatarUrl: participant?.avatar ?? '',
                      bio: '',
                      location: '',
                      website: '',
                      isAdmin: false,
                      createdAt: '',
                      updatedAt: '',
                    },
                    createdAt: '',
                    updatedAt: '',
                  };
                })}
                onAddComment={async (path, line, body) => {
                  live.sendDraft(path, line ?? 0, body);
                }}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="max-w-2xl flex flex-col gap-4">

          {/* Active collective proposal banner */}
          {live.proposal ? (
            <div className="border border-border rounded-md p-4 bg-canvas-subtle flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-fg-muted" />
                  <span className="text-sm font-semibold text-fg">Pending collective verdict</span>
                </div>
                <span className="text-xs text-fg-muted">
                  {live.proposal.acceptedCount} / {live.proposal.totalNeeded} accepted
                </span>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <VerdictIcon decision={live.proposal.decision} />
                <div>
                  <span className="font-medium text-fg capitalize">
                    {live.proposal.decision.replace(/_/g, ' ')}
                  </span>
                  <span className="text-fg-muted ml-1">proposed by {live.proposal.proposerName}</span>
                  {live.proposal.body && (
                    <p className="text-fg-muted mt-1">{live.proposal.body}</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-[#2ea043] transition-all"
                  style={{ width: `${(live.proposal.acceptedCount / live.proposal.totalNeeded) * 100}%` }}
                />
              </div>

              {/* Voting buttons — only for non-proposer, non-PR-author */}
              {live.proposal.proposerId === myUserId ? (
                <p className="text-xs text-fg-muted text-center">
                  Waiting for {live.proposal.totalNeeded - live.proposal.acceptedCount} more participant(s) to accept…
                </p>
              ) : prAuthorUsername === currentUsername ? (
                <p className="text-xs text-fg-muted text-center">
                  You are the PR author — your acceptance is not required.
                </p>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => live.acceptVerdict(live.proposal!.proposalId)}
                  >
                    <CheckCircle2 size={13} className="mr-1" /> Accept
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => live.rejectVerdict(live.proposal!.proposalId)}
                  >
                    <X size={13} className="mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Propose new verdict form — shown when no active proposal */
            <>
              <p className="text-sm text-fg-muted">
                Propose a verdict for this PR. All {live.participants.length} participant(s) in the lobby
                must accept before the review is recorded.
              </p>

              {/* Decision */}
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { value: 'comment', label: 'Comment', icon: <MessageSquare size={13} />, color: 'text-fg-muted' },
                    { value: 'approve', label: 'Approve', icon: <CheckCircle2 size={13} />, color: 'text-[#2ea043]' },
                    { value: 'request_changes', label: 'Request changes', icon: <AlertCircle size={13} />, color: 'text-[#da3633]' },
                  ] as const
                ).map(({ value, label, icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setVerdictDecision(value)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors',
                      verdictDecision === value
                        ? 'border-accent-emphasis bg-accent-emphasis/10 text-fg'
                        : 'border-border text-fg-muted hover:border-border-muted',
                      color,
                    )}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <textarea
                value={verdictDraft}
                onChange={(e) => setVerdictDraft(e.target.value)}
                placeholder="Leave a review summary (optional)"
                rows={5}
                className="w-full bg-canvas-subtle border border-border rounded-md px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent-emphasis resize-y"
              />

              <Button
                variant={verdictDecision === 'approve' ? 'success' : verdictDecision === 'request_changes' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleProposeVerdict}
              >
                Propose verdict to all participants
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Session list / creation view ─────────────────────────────────────────────

function SessionPicker({
  pr,
  username,
  repo,
  prNumber,
  token,
  onJoin,
}: {
  pr: PullRequest;
  username: string;
  repo: string;
  prNumber: string;
  token: string;
  onJoin: (session: LiveSession) => void;
}) {
  const [sessions, setSessions] = useState<LiveSession[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Load sessions
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchSessions(pr.id, token);
      setSessions(list ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [pr.id, token]);

  // Load on mount
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const session = await createSession(username, repo, pr.number, token, createTitle || 'Live Review');
      onJoin(session);
    } catch (e) {
      console.error('[live] createSession error', e);
    } finally {
      setCreating(false);
    }
  }, [username, repo, pr.number, token, createTitle, onJoin]);

  return (
    <div className="max-w-2xl mx-auto py-8 flex flex-col gap-6">
      {/* PR info */}
      <div className="border border-border rounded-md p-4">
        <p className="text-xs text-fg-muted mb-1">Pull Request</p>
        <p className="font-semibold text-fg">#{pr.number} — {pr.title}</p>
        <p className="text-xs text-fg-muted mt-1">{pr.headBranch} → {pr.baseBranch}</p>
      </div>

      {/* Existing open sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-fg flex items-center gap-1.5">
            <Radio size={14} className="text-[#2ea043]" />
            Open review lobbies
          </p>
          <Button variant="ghost" size="sm" onClick={loadSessions}>Refresh</Button>
        </div>

        {loading && <div className="flex justify-center my-4"><Spinner /></div>}

        {!loading && sessions?.length === 0 && (
          <p className="text-sm text-fg-muted text-center py-4 border border-dashed border-border rounded-md">
            No active lobbies yet. Create one below.
          </p>
        )}

        {!loading && sessions && sessions.length > 0 && (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.ID} className="flex items-center justify-between border border-border rounded-md p-3">
                <div>
                  <p className="text-sm font-medium text-fg">{s.Title}</p>
                  <p className="text-xs text-fg-muted">Created {new Date(s.CreatedAt).toLocaleString()}</p>
                </div>
                <Button variant="success" size="sm" onClick={() => onJoin(s)}>
                  <LogIn size={13} className="mr-1.5" /> Join
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create new session */}
      <div className="border border-border rounded-md p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-fg flex items-center gap-1.5">
          <PlusCircle size={14} />
          Create a new lobby
        </p>
        <input
          type="text"
          value={createTitle}
          onChange={(e) => setCreateTitle(e.target.value)}
          placeholder="Lobby title (optional)"
          className="bg-canvas-subtle border border-border rounded-md px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent-emphasis"
        />
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating}>
          {creating ? <Spinner size="sm" /> : <PlusCircle size={13} className="mr-1.5" />}
          Create lobby
        </Button>
      </div>

      <Link href={`/${username}/${repo}/pulls/${prNumber}`} className="text-xs text-fg-muted hover:text-fg flex items-center gap-1">
        <ArrowLeft size={12} /> Back to pull request
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivePRPage() {
  const params = useParams<{ username: string; repo: string; number: string }>();
  const { user, accessToken } = useAuth();
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: params.username, name: params.repo },
    skip: !params.username || !params.repo,
  });

  const { data, loading: prLoading } = useQuery<{ getPullRequest: PullRequest }>(GET_PULL_REQUEST, {
    variables: { owner: params.username, repo: params.repo, number: parseInt(params.number, 10) },
    skip: !params.username || !params.repo,
  });

  const pr = data?.getPullRequest;

  if (prLoading || !pr) {
    return (
      <RepoLayout owner={params.username} repo={params.repo} repository={repoData?.getRepository}>
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </RepoLayout>
    );
  }

  if (!user || !accessToken) {
    return (
      <RepoLayout owner={params.username} repo={params.repo} repository={repoData?.getRepository}>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-fg-muted text-sm">You must be signed in to use Live Review.</p>
          <Link href="/login">
            <Button variant="primary" size="sm">Sign in</Button>
          </Link>
        </div>
      </RepoLayout>
    );
  }

  return (
    <RepoLayout owner={params.username} repo={params.repo} repository={repoData?.getRepository}>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* Page header */}
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Users size={14} />
          <span>Live PR Review</span>
        </div>

        {activeSession ? (
          <LobbyView
            session={activeSession}
            pr={pr}
            username={params.username}
            repo={params.repo}
            prNumber={params.number}
            token={accessToken}
            prAuthorUsername={pr.author.username}
            currentUsername={user?.username ?? ''}
            currentUser={user}
            onClose={() => setActiveSession(null)}
          />
        ) : (
          <SessionPicker
            pr={pr}
            username={params.username}
            repo={params.repo}
            prNumber={params.number}
            token={accessToken}
            onJoin={setActiveSession}
          />
        )}
      </div>
    </RepoLayout>
  );
}
