'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { CircleDot, CheckCircle2, GitMerge, Circle, MessageSquare, Settings, Check } from 'lucide-react';
import {
  GET_ISSUE, LIST_ISSUE_COMMENTS, GET_REPOSITORY, LIST_LABELS, LIST_COLLABORATORS,
} from '@/graphql/queries';
import {
  CLOSE_ISSUE,
  REOPEN_ISSUE,
  CREATE_ISSUE_COMMENT,
  UPDATE_ISSUE_COMMENT,
  DELETE_ISSUE_COMMENT,
  ADD_ISSUE_LABEL,
  REMOVE_ISSUE_LABEL,
  ADD_ISSUE_ASSIGNEE,
  REMOVE_ISSUE_ASSIGNEE,
} from '@/graphql/mutations';
import {
  Issue, IssueComment, ListIssueCommentsResponse, Repository,
  ListLabelsResponse, ListCollaboratorsResponse, Label,
} from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import CommentItem from '@/components/issues/CommentItem';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

function contrastColor(hex: string) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#0d1117' : '#ffffff';
}

export default function IssuePage() {
  const { username, repo, number } = useParams<{ username: string; repo: string; number: string }>();
  const { user } = useAuth();
  const issueNumber = parseInt(number, 10);
  const [commentBody, setCommentBody] = useState('');

  // Dropdown state
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);
  const assigneesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (labelsRef.current && !labelsRef.current.contains(e.target as Node)) setLabelsOpen(false);
      if (assigneesRef.current && !assigneesRef.current.contains(e.target as Node)) setAssigneesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data: issueData, loading, refetch: refetchIssue } = useQuery<{ getIssue: Issue }>(GET_ISSUE, {
    variables: { owner: username, repo, number: issueNumber },
  });
  const { data: commentsData, refetch: refetchComments } = useQuery<{
    listIssueComments: ListIssueCommentsResponse;
  }>(LIST_ISSUE_COMMENTS, {
    variables: { owner: username, repo, number: issueNumber },
  });
  const { data: allLabelsData } = useQuery<{ listLabels: ListLabelsResponse }>(LIST_LABELS, {
    variables: { owner: username, repo },
  });
  const { data: collabData } = useQuery<{ listCollaborators: ListCollaboratorsResponse }>(
    LIST_COLLABORATORS,
    { variables: { owner: username, name: repo }, skip: !username || !repo },
  );

  const [closeIssue, { loading: closing }] = useMutation(CLOSE_ISSUE, {
    onCompleted: () => refetchIssue(),
  });
  const [reopenIssue, { loading: reopening }] = useMutation(REOPEN_ISSUE, {
    onCompleted: () => refetchIssue(),
  });
  const [createComment, { loading: commenting }] = useMutation(CREATE_ISSUE_COMMENT, {
    onCompleted: () => { setCommentBody(''); refetchComments(); },
  });
  const [updateComment] = useMutation(UPDATE_ISSUE_COMMENT, { onCompleted: () => refetchComments() });
  const [deleteComment] = useMutation(DELETE_ISSUE_COMMENT, { onCompleted: () => refetchComments() });
  const [addLabel] = useMutation(ADD_ISSUE_LABEL, { onCompleted: () => refetchIssue() });
  const [removeLabel] = useMutation(REMOVE_ISSUE_LABEL, { onCompleted: () => refetchIssue() });
  const [addAssignee] = useMutation(ADD_ISSUE_ASSIGNEE, { onCompleted: () => refetchIssue() });
  const [removeAssignee] = useMutation(REMOVE_ISSUE_ASSIGNEE, { onCompleted: () => refetchIssue() });

  const issue = issueData?.getIssue;
  const comments = commentsData?.listIssueComments.comments ?? [];
  const allLabels = allLabelsData?.listLabels.labels ?? [];
  const collaborators = collabData?.listCollaborators?.collaborators ?? [];
  const isOwnerOrAuthor = user?.username === username || user?.username === issue?.author?.username;
  const canEditMeta = user?.username === username; // only repo owner manages labels/assignees

  const stateColor = issue?.state === 'open' ? 'text-success-fg' : 'text-purple-fg';
  const StateIcon = issue?.state === 'open' ? CircleDot : CheckCircle2;

  function handleToggleLabel(l: Label) {
    if (!issue) return;
    const has = issue.labels.some((il) => il.id === l.id);
    if (has) {
      removeLabel({ variables: { owner: username, repo, number: issueNumber, labelName: l.name } });
    } else {
      addLabel({ variables: { owner: username, repo, number: issueNumber, labelName: l.name } });
    }
  }

  function handleToggleAssignee(uname: string) {
    if (!issue) return;
    const has = issue.assignees.some((a) => a.username === uname);
    if (has) {
      removeAssignee({ variables: { owner: username, repo, number: issueNumber, username: uname } });
    } else {
      addAssignee({ variables: { owner: username, repo, number: issueNumber, username: uname } });
    }
  }

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !issue ? (
        <p className="text-center text-fg-muted py-12">Issue not found.</p>
      ) : (
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-fg">
                {issue.title}{' '}
                <span className="text-fg-muted font-normal">#{issue.number}</span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-fg-muted">
                <StateIcon size={16} className={stateColor} />
                <span className={`font-medium ${stateColor}`}>
                  {issue.state === 'open' ? 'Open' : 'Closed'}
                </span>
                <span>
                  opened {formatRelativeTime(issue.createdAt)} by{' '}
                  <span className="text-fg font-medium">{issue.author?.username}</span>
                </span>
                {comments.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare size={13} /> {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Original post */}
            <div className="border border-border rounded-md overflow-hidden">
              <div className="flex items-center justify-between bg-canvas-overlay px-4 py-2.5 border-b border-border">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar src={issue.author?.avatarUrl} name={issue.author?.username ?? ''} size={20} />
                  <span className="font-medium text-fg">{issue.author?.username}</span>
                  <span className="text-fg-muted">commented {formatRelativeTime(issue.createdAt)}</span>
                </div>
              </div>
              <div className="px-4 py-4">
                {issue.body ? (
                  <MarkdownRenderer>{issue.body}</MarkdownRenderer>
                ) : (
                  <em className="text-fg-muted">No description provided.</em>
                )}
              </div>
            </div>

            {/* Comments */}
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUsername={user?.username}
                onUpdate={(id, body) =>
                  updateComment({ variables: { owner: username, repo, commentId: id, body } })
                }
                onDelete={(id) =>
                  deleteComment({ variables: { owner: username, repo, commentId: id } })
                }
              />
            ))}

            {/* Add comment */}
            {user && (
              <div className="border border-border rounded-md overflow-hidden">
                <div className="flex items-center gap-2 bg-canvas-overlay px-4 py-2.5 border-b border-border text-sm">
                  <Avatar src={user.avatarUrl} name={user.username} size={20} />
                  <span className="font-medium text-fg">Leave a comment</span>
                </div>
                <div className="p-4 space-y-3">
                  <Textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Write a comment…"
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    {isOwnerOrAuthor && (
                      <div>
                        {issue.state === 'open' ? (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={closing}
                            onClick={() =>
                              closeIssue({ variables: { owner: username, repo, number: issueNumber } })
                            }
                          >
                            Close issue
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            loading={reopening}
                            onClick={() =>
                              reopenIssue({ variables: { owner: username, repo, number: issueNumber } })
                            }
                          >
                            Reopen issue
                          </Button>
                        )}
                      </div>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      loading={commenting}
                      disabled={!commentBody.trim()}
                      onClick={() =>
                        createComment({
                          variables: { owner: username, repo, number: issueNumber, body: commentBody },
                        })
                      }
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {!user && (
              <div className="border border-border rounded-md p-4 text-center text-sm text-fg-muted">
                <Link href="/login" className="text-accent-fg hover:underline font-medium">Sign in</Link>
                {' '}to leave a comment.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-60 shrink-0 space-y-0 text-sm">

            {/* Labels */}
            <div className="border-b border-border py-4" ref={labelsRef}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-fg uppercase tracking-wide">Labels</span>
                {canEditMeta && (
                  <button
                    onClick={() => setLabelsOpen((o) => !o)}
                    className="p-0.5 text-fg-muted hover:text-fg rounded"
                    title="Edit labels"
                  >
                    <Settings size={14} />
                  </button>
                )}
              </div>
              {issue.labels?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels.map((l) => {
                    const bg = `#${l.color}`;
                    return (
                      <span
                        key={l.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: bg, color: contrastColor(l.color) }}
                      >
                        {l.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-fg-muted">None yet</p>
              )}
              {labelsOpen && (
                <div className="mt-2 border border-border rounded-md overflow-hidden shadow-lg bg-canvas z-10">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-fg">Apply labels to this issue</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {allLabels.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-fg-muted">No labels defined</p>
                    ) : (
                      allLabels.map((l) => {
                        const active = issue.labels.some((il) => il.id === l.id);
                        const bg = `#${l.color}`;
                        return (
                          <button
                            key={l.id}
                            onClick={() => handleToggleLabel(l)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-canvas-subtle transition-colors text-left"
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: bg }}
                            />
                            <span className="flex-1 text-xs text-fg">{l.name}</span>
                            {active && <Check size={12} className="text-success-fg flex-shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Assignees */}
            <div className="border-b border-border py-4" ref={assigneesRef}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-fg uppercase tracking-wide">Assignees</span>
                {canEditMeta && (
                  <button
                    onClick={() => setAssigneesOpen((o) => !o)}
                    className="p-0.5 text-fg-muted hover:text-fg rounded"
                    title="Edit assignees"
                  >
                    <Settings size={14} />
                  </button>
                )}
              </div>
              {issue.assignees?.length > 0 ? (
                <div className="space-y-2">
                  {issue.assignees.map((a) => (
                    <div key={a.username} className="flex items-center gap-2">
                      <Avatar src={a.avatarUrl} name={a.username} size={18} />
                      <span className="flex-1 text-xs text-fg">{a.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-fg-muted">No one assigned</p>
              )}
              {assigneesOpen && (
                <div className="mt-2 border border-border rounded-md overflow-hidden shadow-lg bg-canvas z-10">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-fg">Assign to a collaborator</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {collaborators.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-fg-muted">No collaborators found</p>
                    ) : (
                      collaborators.map((c) => {
                        const active = issue.assignees.some((a) => a.username === c.username);
                        return (
                          <button
                            key={c.username}
                            onClick={() => handleToggleAssignee(c.username)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-canvas-subtle transition-colors text-left"
                          >
                            <Avatar name={c.username} size={18} />
                            <span className="flex-1 text-xs text-fg">{c.username}</span>
                            {active && <Check size={12} className="text-success-fg flex-shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </RepoLayout>
  );
}
