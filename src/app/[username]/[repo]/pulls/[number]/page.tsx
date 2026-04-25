'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  GitMerge, XCircle, CircleDot, GitCommit, CheckCircle2, AlertCircle,
  Pencil, Check, X, ChevronDown, Settings, Eye, MessageSquare, GitPullRequest,
  FileText, Trash2, Clock,
} from 'lucide-react';
import {
  GET_PULL_REQUEST, GET_PR_DIFF, LIST_PR_COMMENTS, LIST_PR_REVIEWS,
  GET_REPOSITORY, LIST_BRANCHES, LIST_LABELS, LIST_COLLABORATORS,
  LIST_REVIEW_REQUESTS,
} from '@/graphql/queries';
import {
  MERGE_PULL_REQUEST, CLOSE_PULL_REQUEST, REOPEN_PULL_REQUEST,
  CREATE_PR_COMMENT, CREATE_PR_REVIEW, UPDATE_PR_COMMENT, DELETE_PR_COMMENT,
  UPDATE_PULL_REQUEST, ADD_PR_LABEL, REMOVE_PR_LABEL,
  REQUEST_REVIEW, REMOVE_REVIEW_REQUEST,
} from '@/graphql/mutations';
import {
  PullRequest, PRComment, PRReview, Label,
  ListPRCommentsResponse, ListPRReviewsResponse, Repository,
  CompareResponse, ListBranchesResponse, ListLabelsResponse, Commit,
  ListCollaboratorsResponse, ReviewRequest, User,
} from '@/types';
import { clsx } from 'clsx';
import RepoLayout from '@/components/layout/RepoLayout';
import InlineDiffViewer, { parsePatch, normalizeDiffPath, DiffLine } from '@/components/repo/InlineDiffViewer';
import CommentItem from '@/components/issues/CommentItem';
import ReviewItem from '@/components/pulls/ReviewItem';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';


// â”€â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ state, merged }: { state: string; merged: boolean }) {
  if (merged) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-[#8957e5] text-white">
      <GitMerge size={14} /> Merged
    </span>
  );
  if (state === 'open') return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-success-emphasis text-white">
      <CircleDot size={14} /> Open
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-danger-emphasis text-white">
      <XCircle size={14} /> Closed
    </span>
  );
}

// â”€â”€â”€ Sidebar label badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LabelBadge({ label }: { label: Label }) {
  const hex = label.color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = lum > 0.5 ? '#0d1117' : '#ffffff';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `#${hex}`, color: textColor }}
    >
      {label.name}
    </span>
  );
}

// â”€â”€â”€ Commit row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CommitRow({ commit, owner, repo }: { commit: Commit; owner: string; repo: string }) {
  const shortSha = commit.sha.slice(0, 7);
  const title = commit.message.split('\n')[0];
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-canvas-subtle transition-colors">
      <GitCommit size={16} className="text-fg-muted flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-fg truncate">{title}</p>
      <p className="text-xs text-fg-muted mt-0.5">{commit.author.name} · {formatRelativeTime(commit.author.when)}</p>
      </div>
      <Link
        href={`/${owner}/${repo}/commit/${commit.sha}`}
        className="text-xs font-mono text-accent-fg hover:underline flex-shrink-0"
      >
        {shortSha}
      </Link>
    </div>
  );
}

// â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const gitSlug = (s: string) => s.replace(/ /g, '-');

export default function PullRequestPage() {
  const { username, repo, number } = useParams<{ username: string; repo: string; number: string }>();
  const { user } = useAuth();
  const prNumber = parseInt(number, 10);

  // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [activeTab, setActiveTab] = useState<'conversation' | 'commits' | 'files'>('conversation');

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Base branch editing
  const [editingBase, setEditingBase] = useState(false);
  const [newBase, setNewBase] = useState('');

  // Merge
  const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge');
  const [mergeDropdownOpen, setMergeDropdownOpen] = useState(false);
  const [squashTitleInput, setSquashTitleInput] = useState('');
  const [squashMessageInput, setSquashMessageInput] = useState('');
  const [showSquashInputs, setShowSquashInputs] = useState(false);
  const mergeDropRef = useRef<HTMLDivElement>(null);

  // Comment
  const [commentBody, setCommentBody] = useState('');

  // Review
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewState, setReviewState] = useState<'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'>('COMMENTED');

  // Reviewer picker
  const [reviewerPickerOpen, setReviewerPickerOpen] = useState(false);
  const reviewerPickerRef = useRef<HTMLDivElement>(null);

  // Labels dropdown
  const [labelsOpen, setLabelsOpen] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mergeDropRef.current && !mergeDropRef.current.contains(e.target as Node)) {
        setMergeDropdownOpen(false);
      }
      if (labelsRef.current && !labelsRef.current.contains(e.target as Node)) {
        setLabelsOpen(false);
      }
      if (reviewerPickerRef.current && !reviewerPickerRef.current.contains(e.target as Node)) {
        setReviewerPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // â”€â”€ Queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
    context: { triggerNotFoundOn404: true },
  });
  const { data: prData, loading, refetch: refetchPR } = useQuery<{ getPullRequest: PullRequest }>(
    GET_PULL_REQUEST,
    { variables: { owner: username, repo, number: prNumber }, context: { triggerNotFoundOn404: true } }
  );
  const { data: diffData, loading: loadingDiff } = useQuery<{ getPullRequestDiff: CompareResponse }>(
    GET_PR_DIFF,
    {
      variables: { owner: username, repo, number: prNumber },
    }
  );
  const { data: branchesData } = useQuery<{ listBranches: ListBranchesResponse }>(
    LIST_BRANCHES,
    { variables: { owner: username, name: repo }, skip: !editingBase }
  );
  const { data: allLabelsData } = useQuery<{ listLabels: ListLabelsResponse }>(
    LIST_LABELS,
    { variables: { owner: username, repo } }
  );
  const { data: commentsData, refetch: refetchComments } = useQuery<{ listPRComments: ListPRCommentsResponse }>(
    LIST_PR_COMMENTS, { variables: { owner: username, repo, number: prNumber } }
  );
  const { data: reviewsData, refetch: refetchReviews } = useQuery<{ listPRReviews: ListPRReviewsResponse }>(
    LIST_PR_REVIEWS, { variables: { owner: username, repo, number: prNumber } }
  );
  const { data: collabData } = useQuery<{ listCollaborators: ListCollaboratorsResponse }>(
    LIST_COLLABORATORS, { variables: { owner: username, name: repo }, skip: !username || !repo }
  );
  const { data: reviewRequestsData, refetch: refetchReviewRequests } = useQuery<{ listReviewRequests: { requests: ReviewRequest[] } }>(
    LIST_REVIEW_REQUESTS, { variables: { owner: username, repo, number: prNumber } }
  );

  // â”€â”€ Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [mergePR, { loading: merging }] = useMutation(MERGE_PULL_REQUEST, { onCompleted: () => refetchPR() });
  const [closePR, { loading: closing }] = useMutation(CLOSE_PULL_REQUEST, { onCompleted: () => refetchPR() });
  const [reopenPR, { loading: reopening }] = useMutation(REOPEN_PULL_REQUEST, { onCompleted: () => refetchPR() });
  const [createComment, { loading: commenting }] = useMutation(CREATE_PR_COMMENT, {
    onCompleted: () => { setCommentBody(''); refetchComments(); },
  });
  const [updateComment] = useMutation(UPDATE_PR_COMMENT, { onCompleted: () => refetchComments() });
  const [deleteComment] = useMutation(DELETE_PR_COMMENT, { onCompleted: () => refetchComments() });
  const [submitReview, { loading: submittingReview }] = useMutation(CREATE_PR_REVIEW, {
    onCompleted: () => { setReviewBody(''); setReviewPanelOpen(false); refetchReviews(); },
  });
  const [updatePR, { loading: updatingPR }] = useMutation(UPDATE_PULL_REQUEST, {
    onCompleted: () => { setEditingTitle(false); setEditingBase(false); refetchPR(); },
  });
  const [addLabel] = useMutation(ADD_PR_LABEL, { onCompleted: () => refetchPR() });
  const [removeLabel] = useMutation(REMOVE_PR_LABEL, { onCompleted: () => refetchPR() });
  const [requestReview] = useMutation(REQUEST_REVIEW, { onCompleted: () => refetchReviewRequests() });
  const [removeReviewRequest] = useMutation(REMOVE_REVIEW_REQUEST, { onCompleted: () => refetchReviewRequests() });

  // â”€â”€ Derived data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pr = prData?.getPullRequest;
  const allComments: PRComment[] = commentsData?.listPRComments.comments ?? [];
  const reviews: PRReview[] = reviewsData?.listPRReviews.reviews ?? [];
  const allLabels: Label[] = allLabelsData?.listLabels.labels ?? [];
  const collaborators = collabData?.listCollaborators?.collaborators ?? [];
  const isRepoOwner = user?.username === username;
  const isCollaborator = collaborators.some((c) => c.username === user?.username);
  const canWrite = isRepoOwner || isCollaborator;
  const canEdit = canWrite || user?.username === pr?.author.username;

  // Separate inline vs general comments
  const generalComments = allComments.filter((c) => !c.path);
  const inlineComments = allComments.filter((c) => !!c.path);

  // Interleaved timeline: reviews, general comments, individual inline comments, commits
  const timeline = useMemo(() => {
    const commitList: Commit[] = diffData?.getPullRequestDiff?.commits ?? [];
    type TItem =
      | { type: 'review'; date: number; data: PRReview }
      | { type: 'comment'; date: number; data: PRComment }
      | { type: 'inline'; date: number; data: PRComment }
      | { type: 'commit'; date: number; data: Commit };
    const items: TItem[] = [
      ...reviews.map((r) => ({ type: 'review' as const, date: new Date(r.submittedAt).getTime(), data: r })),
      ...generalComments.map((c) => ({ type: 'comment' as const, date: new Date(c.createdAt).getTime(), data: c })),
      ...inlineComments.map((c) => ({ type: 'inline' as const, date: new Date(c.createdAt).getTime(), data: c })),
      ...commitList.map((c) => ({ type: 'commit' as const, date: new Date(c.author.when).getTime(), data: c })),
    ];
    return items.sort((a, b) => a.date - b.date);
  }, [reviews, generalComments, inlineComments, diffData]);

  // Latest review per reviewer
  const uniqueReviewers = useMemo(() => {
    const map = new Map<string, PRReview>();
    reviews.forEach((r) => map.set(r.reviewer.username, r));
    return Array.from(map.values());
  }, [reviews]);

  const diffFiles = diffData?.getPullRequestDiff?.files ?? [];
  const diffPatch = diffData?.getPullRequestDiff?.patch;
  const commits: Commit[] = diffData?.getPullRequestDiff?.commits ?? [];
  const parsedDiff = useMemo(() => diffPatch ? parsePatch(diffPatch) : null, [diffPatch]);

  function getCommentContext(path: string | null | undefined, line: number | null | undefined, ctx = 2): DiffLine[] {
    if (!parsedDiff || !path || line == null) return [];
    const normalized = normalizeDiffPath(path);
    const lines = parsedDiff.get(normalized) ?? parsedDiff.get(path) ?? [];
    const visible = lines.filter((l) => l.type !== 'meta' && l.type !== 'hunk');
    const idx = visible.findIndex((l) => l.newNo === line || l.oldNo === line);
    if (idx === -1) return [];
    return visible.slice(Math.max(0, idx - ctx), Math.min(visible.length, idx + ctx + 1));
  }

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveTitle = () => {
    if (!newTitle.trim() || !pr) return;
    updatePR({ variables: { input: { owner: username, repo, number: prNumber, title: newTitle.trim() } } });
  };

  const handleSaveBase = () => {
    if (!newBase || !pr) return;
    updatePR({ variables: { input: { owner: username, repo, number: prNumber, base: newBase } } });
  };

  const handleMerge = () => {
    if (!pr) return;
    mergePR({
      variables: {
        input: {
          owner: username,
          repo,
          number: prNumber,
          mergeMethod,
          ...(mergeMethod === 'squash' && {
            commitTitle: squashTitleInput || pr.title,
            commitMessage: squashMessageInput || undefined,
          }),
        },
      },
    });
  };

  const handleToggleLabel = (label: Label) => {
    const hasLabel = pr?.labels.some((l) => l.id === label.id);
    if (hasLabel) {
      removeLabel({ variables: { owner: username, repo, number: prNumber, labelName: label.name } });
    } else {
      addLabel({ variables: { owner: username, repo, number: prNumber, labelName: label.name } });
    }
  };

  const handleAddInlineComment = async (path: string, line: number | null, body: string) => {
    await createComment({ variables: { input: { owner: username, repo, number: prNumber, body, path, line } } });
    refetchComments();
  };

  const mergeMethodLabels = {
    merge: 'Create a merge commit',
    squash: 'Squash and merge',
    rebase: 'Rebase and merge',
  };

  // â”€â”€ Tab counts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tabs = [
    { id: 'conversation' as const, label: 'Conversation', icon: <MessageSquare size={14} />, count: allComments.length + reviews.length },
    { id: 'commits' as const, label: 'Commits', icon: <GitCommit size={14} />, count: commits.length },
    { id: 'files' as const, label: 'Files changed', icon: <GitPullRequest size={14} />, count: diffFiles.length },
  ];

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !pr ? (
        <p className="text-center text-fg-muted py-20">Pull request not found.</p>
      ) : (
        <div>
          {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="mb-4">
            {/* Title row */}
            <div className="flex items-start gap-3 mb-2">
              {editingTitle ? (
                <div className="flex-1 flex gap-2 items-center min-w-0">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 bg-canvas-subtle border border-border rounded-md px-3 py-1.5 text-xl font-semibold text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  />
                  <Button size="sm" variant="primary" loading={updatingPR} onClick={handleSaveTitle} disabled={!newTitle.trim()}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
                </div>
              ) : (
                <h1 className="flex-1 text-2xl font-semibold text-fg leading-tight">
                  {pr.title}
                  <span className="text-fg-muted font-normal ml-2">#{pr.number}</span>
                </h1>
              )}
              {!editingTitle && canEdit && pr.state === 'open' && !pr.merged && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-shrink-0 mt-0.5"
                  onClick={() => { setNewTitle(pr.title); setEditingTitle(true); }}
                >
                  <Pencil size={13} className="mr-1" /> Edit
                </Button>
              )}
            </div>

            {/* Status + meta */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted">
              <StatusBadge state={pr.state} merged={pr.merged} />
              <span>
                <Link href={`/${pr.author.username}`} className="font-medium text-fg hover:text-accent-fg">
                  {pr.author.username}
                </Link>
                {' '}wants to merge{' '}
                <code className="bg-canvas-subtle border border-border/60 px-1.5 py-0.5 rounded text-xs text-accent-fg">{gitSlug(pr.headBranch)}</code>
                {' into '}
                {editingBase ? (
                  <span className="inline-flex items-center gap-1 align-middle">
                    <select
                      value={newBase}
                      onChange={(e) => setNewBase(e.target.value)}
                      className="bg-canvas border border-border rounded px-1.5 py-0.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {branchesData?.listBranches.branches?.map((b) => (
                        <option key={b.name} value={b.name}>{gitSlug(b.name)}</option>
                      ))}
                    </select>
                    <button disabled={updatingPR || !newBase} onClick={handleSaveBase} className="text-success-fg hover:text-success-fg/80 disabled:opacity-50" title="Confirm">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingBase(false)} className="text-danger-fg hover:text-danger-fg/80" title="Cancel">
                      <X size={14} />
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 align-middle">
                    <code className="bg-canvas-subtle border border-border/60 px-1.5 py-0.5 rounded text-xs text-accent-fg">{gitSlug(pr.baseBranch)}</code>
                    {canWrite && pr.state === 'open' && !pr.merged && (
                      <button onClick={() => { setNewBase(pr.baseBranch); setEditingBase(true); }} className="text-fg-muted hover:text-fg ml-0.5" title="Change base branch">
                        <Pencil size={11} />
                      </button>
                    )}
                  </span>
                )}
              </span>
              <span className="text-fg-muted/40">{' \u00B7 '}</span>
              <span>{formatRelativeTime(pr.createdAt)}</span>
              {pr.merged && pr.mergedAt && (
                <><span className="text-fg-muted/40">{' \u00B7 '}</span><span className="text-[#dcbdfb]">merged {formatRelativeTime(pr.mergedAt)}</span></>
              )}
              <span className="text-fg-muted/40">{' \u00B7 '}</span>
              <span className="flex items-center gap-1">
                <GitCommit size={12} />
                {diffData?.getPullRequestDiff?.commitsAhead ?? pr.commits} commit{(diffData?.getPullRequestDiff?.commitsAhead ?? pr.commits) !== 1 ? 's' : ''}
              </span>
              <span className="text-success-fg font-medium">+{pr.additions}</span>
              <span className="text-danger-fg font-medium">-{pr.deletions}</span>
            </div>
          </div>

          {/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex border-b border-border -mx-0 mb-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-fg text-fg font-semibold'
                    : 'border-transparent text-fg-muted hover:text-fg hover:bg-canvas-subtle'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-canvas-overlay text-fg-muted text-xs px-1.5 py-px rounded-full font-normal">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* â”€â”€ Conversation Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'conversation' && (
            <div className="flex gap-6 items-start">
              {/* Main timeline */}
              <div className="flex-1 min-w-0 space-y-4">

                {/* PR description */}
                {pr.body && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <div className="flex items-center gap-2 bg-canvas-overlay px-4 py-2.5 border-b border-border text-sm">
                      <Avatar src={pr.author?.avatarUrl} name={pr.author?.username ?? ''} size={20} />
                      <Link href={`/${pr.author.username}`} className="font-semibold text-fg hover:text-accent-fg">{pr.author.username}</Link>
                      <span className="text-fg-muted">commented {formatRelativeTime(pr.createdAt)}</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-border text-fg-muted">Author</span>
                    </div>
                    <div className="px-4 py-4 prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <MarkdownRenderer>{pr.body}</MarkdownRenderer>
                    </div>
                  </div>
                )}

                {/* Interleaved timeline: reviews, comments, inline code comments, commits */}
                {timeline.map((item) => {
                  if (item.type === 'review') {
                    return <ReviewItem key={`review-${item.data.id}`} review={item.data} />;
                  }
                  if (item.type === 'comment') {
                    const c = item.data;
                    return (
                      <CommentItem
                        key={`comment-${c.id}`}
                        comment={{ id: c.id, body: c.body, author: c.author, createdAt: c.createdAt, updatedAt: c.updatedAt }}
                        currentUsername={user?.username}
                        onUpdate={(id, body) => updateComment({ variables: { owner: username, repo, commentId: id, body } })}
                        onDelete={(id) => deleteComment({ variables: { owner: username, repo, commentId: id } })}
                      />
                    );
                  }
                  if (item.type === 'commit') {
                    const c = item.data;
                    return (
                      <div key={`commit-${c.sha}`} className="flex items-center gap-3 py-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-canvas-overlay border border-border flex items-center justify-center flex-shrink-0">
                          <GitCommit size={11} className="text-fg-muted" />
                        </div>
                        <span className="flex-1 min-w-0 truncate text-fg-muted">
                          <Link href={`/${username}/${repo}/commit/${c.sha}`} className="text-fg hover:text-accent-fg font-medium">{c.message.split('\n')[0]}</Link>
                          {' by '}
                          <span className="text-fg">{c.author.name}</span>
                        </span>
                        <Link href={`/${username}/${repo}/commit/${c.sha}`} className="font-mono text-xs text-accent-fg hover:underline flex-shrink-0">{c.sha.slice(0, 7)}</Link>
                        <span className="text-xs text-fg-muted flex-shrink-0">{formatRelativeTime(c.author.when)}</span>
                      </div>
                    );
                  }
                  // inline code comment (individual)
                  const c = item.data;
                  return (
                    <div key={`inline-${c.id}`} className="border border-border rounded-md overflow-hidden">
                      <button
                        className="flex items-center gap-2 w-full px-3 py-1.5 bg-canvas-overlay border-b border-border text-xs hover:bg-canvas-subtle transition-colors"
                        onClick={() => setActiveTab('files')}
                      >
                        <FileText size={11} className="text-fg-muted flex-shrink-0" />
                        <span className="font-mono text-fg flex-1 truncate text-left">{c.path}</span>
                        {c.line != null && (
                          <span className="text-fg-muted flex-shrink-0 whitespace-nowrap">Line {c.line}</span>
                        )}
                        <span className="text-accent-fg flex-shrink-0 whitespace-nowrap ml-2">&rarr; View diff</span>
                      </button>
                      <div className="flex items-start gap-3 px-4 py-3 bg-canvas">
                        <Avatar src={c.author.avatarUrl} name={c.author.username} size={22} className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-fg">{c.author.username}</span>
                            <span className="text-xs text-fg-muted">{formatRelativeTime(c.createdAt)}</span>
                            {user?.username === c.author.username && (
                              <button
                                onClick={() => deleteComment({ variables: { owner: username, repo, commentId: c.id } })}
                                className="ml-auto p-0.5 text-fg-muted hover:text-danger-fg rounded"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <div className="prose prose-sm max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <MarkdownRenderer>{c.body}</MarkdownRenderer>
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const ctx = getCommentContext(c.path, c.line);
                        if (ctx.length === 0) return null;
                        return (
                          <div className="border-t border-border font-mono text-[11px] overflow-x-auto">
                            {ctx.map((l, i) => {
                              const isTarget = l.newNo === c.line || l.oldNo === c.line;
                              const prefix = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
                              const lineNo = l.newNo ?? l.oldNo;
                              return (
                                <div key={i} className={clsx(
                                  'flex items-start px-3 py-px',
                                  l.type === 'add' ? 'bg-[#1a3628]' :
                                  l.type === 'remove' ? 'bg-[#3d1a1f]' :
                                  isTarget ? 'bg-canvas-overlay' : 'bg-canvas-subtle',
                                  isTarget && 'border-l-2 border-accent'
                                )}>
                                  <span className="w-6 text-right text-fg-muted select-none mr-2 flex-shrink-0">{lineNo ?? ''}</span>
                                  <span className={clsx('mr-1 select-none flex-shrink-0',
                                    l.type === 'add' ? 'text-[#57ab5a]' : l.type === 'remove' ? 'text-[#f47067]' : 'text-fg-subtle'
                                  )}>{prefix}</span>
                                  <span className={clsx(
                                    l.type === 'add' ? 'text-[#57ab5a]' : l.type === 'remove' ? 'text-[#f47067]' : 'text-fg'
                                  )}>{l.content}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}

                {/* Merge box */}
                {canWrite && pr.state === 'open' && !pr.merged && (
                  <div className="border border-border rounded-md">
                    {/* Mergeable status */}
                    <div className="flex items-start gap-3 p-4">
                      {pr.mergeable ? (
                        <div className="w-7 h-7 rounded-full bg-success-emphasis flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 size={15} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-danger-emphasis flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle size={15} className="text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-fg">
                          {pr.mergeable ? 'This branch has no conflicts with the base branch' : 'This branch has conflicts that must be resolved'}
                        </p>
                        <p className="text-xs text-fg-muted mt-0.5">
                          {pr.mergeable ? 'Merging can be performed automatically.' : 'Use the command line to resolve conflicts before merging.'}
                        </p>
                      </div>
                    </div>

                    {/* Squash commit inputs */}
                    {mergeMethod === 'squash' && showSquashInputs && (
                      <div className="mx-4 mb-3 border border-border rounded-md overflow-hidden bg-canvas-subtle">
                        <div className="p-3 space-y-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-fg-muted mb-1">Commit title</label>
                            <input
                              value={squashTitleInput}
                              onChange={(e) => setSquashTitleInput(e.target.value)}
                              placeholder={pr.title}
                              className="w-full bg-canvas border border-border rounded px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-fg-muted mb-1">Extended description (optional)</label>
                            <textarea
                              value={squashMessageInput}
                              onChange={(e) => setSquashMessageInput(e.target.value)}
                              rows={4}
                              className="w-full bg-canvas border border-border rounded px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Merge button + dropdown */}
                    <div className="px-4 pb-4 flex items-center gap-0">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={merging}
                        disabled={!pr.mergeable}
                        onClick={handleMerge}
                        className="rounded-r-none pr-3"
                      >
                        <GitMerge size={14} className="mr-1.5" />
                        {mergeMethodLabels[mergeMethod]}
                      </Button>
                      <div className="relative" ref={mergeDropRef}>
                        <button
                          disabled={!pr.mergeable}
                          onClick={() => setMergeDropdownOpen((o) => !o)}
                          className="h-[33px] px-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 border-l border-white/20 rounded-r-md text-white transition-colors"
                        >
                          <ChevronDown size={14} />
                        </button>
                        {mergeDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1.5 w-72 bg-canvas border border-border rounded-md shadow-xl z-50 overflow-hidden">
                            {(['merge', 'squash', 'rebase'] as const).map((method) => (
                              <button
                                key={method}
                                onClick={() => {
                                  setMergeMethod(method);
                                  setMergeDropdownOpen(false);
                                  if (method === 'squash') setSquashTitleInput(pr.title);
                                }}
                                className="w-full flex items-start gap-2.5 px-4 py-3 hover:bg-canvas-subtle transition-colors text-left"
                              >
                                <div className="w-4 flex-shrink-0 mt-0.5">
                                  {mergeMethod === method && <Check size={14} className="text-accent-fg" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-fg">{mergeMethodLabels[method]}</p>
                                  <p className="text-xs text-fg-muted mt-0.5">
                                    {method === 'merge' && 'All commits from this branch will be added via a merge commit.'}
                                    {method === 'squash' && 'All commits will be combined into one commit in the base branch.'}
                                    {method === 'rebase' && 'Commits will be rebased and added to the base branch.'}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Squash toggle link */}
                    {mergeMethod === 'squash' && !showSquashInputs && (
                      <div className="px-4 pb-3 -mt-1">
                        <button onClick={() => setShowSquashInputs(true)} className="text-xs text-accent-fg hover:underline">
                          Edit commit message
                        </button>
                      </div>
                    )}
                    {mergeMethod === 'squash' && showSquashInputs && (
                      <div className="px-4 pb-3 -mt-1">
                        <button onClick={() => setShowSquashInputs(false)} className="text-xs text-fg-muted hover:text-fg">
                          Collapse
                        </button>
                      </div>
                    )}

                    {/* Close PR */}
                    <div className="px-4 py-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={closing}
                        onClick={() => closePR({ variables: { owner: username, repo, number: prNumber } })}
                      >
                        Close pull request
                      </Button>
                    </div>
                  </div>
                )}

                {/* Merged display */}
                {pr.merged && (
                  <div className="border border-[#8957e5]/40 bg-[#8957e5]/10 rounded-md p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#8957e5] flex items-center justify-center flex-shrink-0">
                      <GitMerge size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-fg">Pull request successfully merged and closed</p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        <code className="bg-canvas-overlay px-1 rounded text-[#dcbdfb]">{gitSlug(pr.headBranch)}</code>
                        {' can now be safely deleted.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reopen */}
                {pr.state === 'closed' && !pr.merged && isRepoOwner && (
                  <div className="border border-border rounded-md p-4 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-canvas-overlay flex items-center justify-center flex-shrink-0">
                      <XCircle size={15} className="text-danger-fg" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-fg">This pull request is closed.</p>
                    </div>
                    <Button size="sm" loading={reopening} onClick={() => reopenPR({ variables: { owner: username, repo, number: prNumber } })}>
                      Reopen pull request
                    </Button>
                  </div>
                )}

                {/* Add comment */}
                {user ? (
                  <div className="flex gap-3 items-start">
                    <Avatar src={user.avatarUrl} name={user.username} size={32} className="flex-shrink-0 mt-1" />
                    <div className="flex-1 border border-border rounded-md overflow-hidden">
                      <Textarea
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Leave a comment"
                        rows={4}
                        className="rounded-none border-0 border-b border-border bg-canvas focus:ring-0"
                      />
                      <div className="flex items-center justify-between px-3 py-2 bg-canvas-subtle">
                        <p className="text-xs text-fg-muted">Markdown supported</p>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={commenting}
                          disabled={!commentBody.trim()}
                          onClick={() => createComment({ variables: { input: { owner: username, repo, number: prNumber, body: commentBody } } })}
                        >
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border rounded-md p-4 text-center text-sm text-fg-muted">
                    <Link href="/login" className="text-accent-fg hover:underline font-medium">Sign in</Link> to leave a comment.
                  </div>
                )}
              </div>

              {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <aside className="w-60 shrink-0 space-y-0 text-sm">

                {/* Reviewers */}
                <div className="border-b border-border py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-fg uppercase tracking-wide">Reviewers</span>
                    {canWrite && pr.state === 'open' && (
                      <div className="relative" ref={reviewerPickerRef}>
                        <button
                          onClick={() => setReviewerPickerOpen((o) => !o)}
                          className="p-0.5 text-fg-muted hover:text-fg rounded"
                          title="Request a review"
                        >
                          <Settings size={14} />
                        </button>
                        {reviewerPickerOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-52 bg-canvas border border-border rounded-md shadow-xl z-20 overflow-hidden">
                            <div className="px-3 py-2 border-b border-border">
                              <p className="text-xs font-semibold text-fg">Request a review from</p>
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-border/30">
                              {(collabData?.listCollaborators?.collaborators ?? []).length === 0 ? (
                                <p className="px-3 py-2 text-xs text-fg-muted">No collaborators found</p>
                              ) : (
                                (collabData?.listCollaborators?.collaborators ?? [])
                                  .filter((c) => c.username !== user?.username)
                                  .map((c) => {
                                    const reviewRequests = reviewRequestsData?.listReviewRequests?.requests ?? [];
                                    const alreadyRequested = reviewRequests.some((req) => req.reviewer.username === c.username);
                                    const alreadyReviewed = uniqueReviewers.some((r) => r.reviewer.username === c.username);
                                    return (
                                      <button
                                        key={c.username}
                                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-canvas-subtle text-left transition-colors"
                                        onClick={async () => {
                                          if (!alreadyRequested && !alreadyReviewed) {
                                            await requestReview({ variables: { owner: username, repo, number: prNumber, username: c.username } });
                                          } else if (alreadyRequested) {
                                            await removeReviewRequest({ variables: { owner: username, repo, number: prNumber, username: c.username } });
                                          }
                                          setReviewerPickerOpen(false);
                                        }}
                                      >
                                        <Avatar name={c.username} size={18} />
                                        <span className="flex-1 text-xs text-fg">{c.username}</span>
                                        {(alreadyRequested || alreadyReviewed) && (
                                          <Check size={12} className="text-success-fg flex-shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {uniqueReviewers.length === 0 && (reviewRequestsData?.listReviewRequests?.requests?.length ?? 0) === 0 ? (
                    <p className="text-xs text-fg-muted">No reviewers assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {(reviewRequestsData?.listReviewRequests?.requests ?? [])
                        .filter((req) => !uniqueReviewers.some((r) => r.reviewer.username === req.reviewer.username))
                        .map((req) => (
                          <div key={req.reviewer.username} className="flex items-center gap-2">
                            <Avatar src={req.reviewer.avatarUrl} name={req.reviewer.username} size={18} />
                            <span className="flex-1 text-xs text-fg truncate">{req.reviewer.username}</span>
                            <Clock size={13} className="text-fg-muted flex-shrink-0" title="Review requested" />
                          </div>
                        ))}
                      {uniqueReviewers.map((r) => (
                        <div key={r.reviewer.username} className="flex items-center gap-2">
                          <Avatar src={r.reviewer.avatarUrl} name={r.reviewer.username} size={18} />
                          <span className="flex-1 text-xs text-fg truncate">{r.reviewer.username}</span>
                          {r.state === 'APPROVED' && <CheckCircle2 size={13} className="text-success-fg flex-shrink-0" title="Approved" />}
                          {r.state === 'CHANGES_REQUESTED' && <XCircle size={13} className="text-danger-fg flex-shrink-0" title="Changes requested" />}
                          {r.state === 'COMMENTED' && <Eye size={13} className="text-fg-muted flex-shrink-0" title="Commented" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assignees */}
                <div className="border-b border-border py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-fg uppercase tracking-wide">Assignees</span>
                  </div>
                  {pr.assignees.length === 0 ? (
                    <p className="text-xs text-fg-muted">No one assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {pr.assignees.map((a) => (
                        <div key={a.username} className="flex items-center gap-2">
                          <Avatar src={a.avatarUrl} name={a.username} size={18} />
                          <span className="text-xs text-fg">{a.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div className="py-4" ref={labelsRef}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-fg uppercase tracking-wide">Labels</span>
                    {canWrite && (
                      <button
                        onClick={() => setLabelsOpen((o) => !o)}
                        className="p-0.5 text-fg-muted hover:text-fg rounded"
                        title="Edit labels"
                      >
                        <Settings size={14} />
                      </button>
                    )}
                  </div>
                  {pr.labels.length === 0 ? (
                    <p className="text-xs text-fg-muted">None yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {pr.labels.map((l) => <LabelBadge key={l.id} label={l} />)}
                    </div>
                  )}
                  {labelsOpen && (
                    <div className="mt-2 border border-border rounded-md overflow-hidden shadow-lg bg-canvas z-10">
                      {allLabels.length === 0 && <p className="px-3 py-2 text-xs text-fg-muted">No labels defined</p>}
                      {allLabels.map((l) => {
                        const active = pr.labels.some((pl) => pl.id === l.id);
                        return (
                          <button
                            key={l.id}
                            onClick={() => handleToggleLabel(l)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-canvas-subtle transition-colors text-left"
                          >
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: `#${l.color}` }} />
                            <span className="flex-1 text-xs text-fg">{l.name}</span>
                            {active && <Check size={12} className="text-success-fg flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

          {/* â”€â”€ Commits Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'commits' && (
            <div className="border border-border rounded-md overflow-hidden">
              {commits.length === 0 ? (
                <p className="text-center text-fg-muted py-10 text-sm">No commits found.</p>
              ) : (
                commits.map((c) => <CommitRow key={c.sha} commit={c} owner={username} repo={repo} />)
              )}
            </div>
          )}

          {/* â”€â”€ Files Changed Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              {/* Review changes panel */}
              {user && pr.state === 'open' && (
                <div className="flex justify-end">
                  <div className="relative">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setReviewPanelOpen((o) => !o)}
                    >
                      Review changes <ChevronDown size={13} className="ml-1" />
                    </Button>
                    {reviewPanelOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-[440px] bg-canvas border border-border rounded-md shadow-xl z-20 overflow-hidden">
                        <div className="p-4 space-y-3">
                          <p className="text-sm font-semibold text-fg">Finish your review</p>

                          {/* Inline comments summary */}
                          {inlineComments.length > 0 && (
                            <div className="border border-border rounded-md overflow-hidden">
                              <div className="px-3 py-2 bg-canvas-subtle border-b border-border flex items-center gap-1.5">
                                <MessageSquare size={12} className="text-fg-muted" />
                                <span className="text-xs font-medium text-fg-muted">
                                  {inlineComments.length} comment{inlineComments.length !== 1 ? 's' : ''} on changed files
                                </span>
                              </div>
                              <div className="max-h-52 overflow-y-auto divide-y divide-border/40">
                                {Array.from(
                                  inlineComments.reduce((acc, c) => {
                                    const key = c.path ?? '';
                                    if (!acc.has(key)) acc.set(key, []);
                                    acc.get(key)!.push(c);
                                    return acc;
                                  }, new Map<string, typeof inlineComments>())
                                ).map(([filePath, fileComments]) => (
                                  <div key={filePath} className="px-3 py-2">
                                    <p className="text-[11px] font-mono text-fg-muted truncate mb-1.5">{filePath}</p>
                                    <div className="space-y-1.5">
                                      {fileComments.map((c) => {
                                        const ctx = getCommentContext(c.path, c.line);
                                        return (
                                          <div key={c.id} className="space-y-1">
                                            <div className="flex items-start gap-2">
                                              <Avatar src={c.author.avatarUrl} name={c.author.username} size={16} />
                                              <div className="flex-1 min-w-0">
                                                <span className="text-[11px] font-medium text-fg">{c.author.username}</span>
                                                {c.line != null && (
                                                  <span className="text-[11px] text-fg-muted ml-1">line {c.line}</span>
                                                )}
                                                <p className="text-[11px] text-fg-muted truncate">{c.body}</p>
                                              </div>
                                            </div>
                                            {ctx.length > 0 && (
                                              <div className="rounded overflow-hidden border border-border/50 font-mono text-[10px]">
                                                {ctx.map((l, i) => {
                                                  const isTarget = l.newNo === c.line || l.oldNo === c.line;
                                                  const prefix = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
                                                  const lineNo = l.newNo ?? l.oldNo;
                                                  return (
                                                    <div key={i} className={clsx(
                                                      'flex items-start px-2 py-px',
                                                      l.type === 'add' ? 'bg-[#1a3628]' :
                                                      l.type === 'remove' ? 'bg-[#3d1a1f]' :
                                                      isTarget ? 'bg-canvas-overlay' : 'bg-canvas-subtle',
                                                      isTarget && 'border-l-2 border-accent'
                                                    )}>
                                                      <span className="w-5 text-right text-fg-muted select-none mr-2 flex-shrink-0">{lineNo ?? ''}</span>
                                                      <span className={clsx('mr-1 select-none flex-shrink-0',
                                                        l.type === 'add' ? 'text-[#57ab5a]' : l.type === 'remove' ? 'text-[#f47067]' : 'text-fg-subtle'
                                                      )}>{prefix}</span>
                                                      <span className={clsx('truncate',
                                                        l.type === 'add' ? 'text-[#57ab5a]' : l.type === 'remove' ? 'text-[#f47067]' : 'text-fg'
                                                      )}>{l.content}</span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Textarea
                            value={reviewBody}
                            onChange={(e) => setReviewBody(e.target.value)}
                            placeholder="Leave a comment (optional)"
                            rows={4}
                            className="text-sm"
                          />
                          <div className="space-y-2">
                            {([
                              { value: 'COMMENTED', label: 'Comment', desc: 'Submit general feedback without explicit approval.' },
                              { value: 'APPROVED', label: 'Approve', desc: 'Submit feedback and approve merging these changes.' },
                              { value: 'CHANGES_REQUESTED', label: 'Request changes', desc: 'Submit feedback that must be addressed before merging.' },
                            ] as const).map((opt) => (
                              <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer p-2 rounded hover:bg-canvas-subtle">
                                <input
                                  type="radio"
                                  name="reviewState"
                                  checked={reviewState === opt.value}
                                  onChange={() => setReviewState(opt.value)}
                                  className="mt-0.5 accent-accent"
                                />
                                <div>
                                  <p className="text-sm font-medium text-fg">{opt.label}</p>
                                  <p className="text-xs text-fg-muted mt-0.5">{opt.desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="primary"
                              size="sm"
                              loading={submittingReview}
                              onClick={() => submitReview({ variables: { input: { owner: username, repo, number: prNumber, state: reviewState, body: reviewBody } } })}
                              className="flex-1"
                            >
                              Submit review
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setReviewPanelOpen(false)}>Cancel</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loadingDiff ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
              ) : (
                <InlineDiffViewer
                  files={diffFiles}
                  patch={diffPatch}
                  inlineComments={inlineComments}
                  currentUser={user}
                  onAddComment={user ? handleAddInlineComment : undefined}
                  onUpdateComment={(id, body) => updateComment({ variables: { owner: username, repo, commentId: id, body } })}
                  onDeleteComment={(id) => deleteComment({ variables: { owner: username, repo, commentId: id } })}
                />
              )}
            </div>
          )}
        </div>
      )}
    </RepoLayout>
  );
}
