'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { CircleDot, CheckCircle2, GitMerge, Circle, MessageSquare } from 'lucide-react';
import { GET_ISSUE, LIST_ISSUE_COMMENTS, GET_REPOSITORY } from '@/graphql/queries';
import {
  CLOSE_ISSUE,
  REOPEN_ISSUE,
  CREATE_ISSUE_COMMENT,
  UPDATE_ISSUE_COMMENT,
  DELETE_ISSUE_COMMENT,
} from '@/graphql/mutations';
import { Issue, IssueComment, ListIssueCommentsResponse, Repository } from '@/types';
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

export default function IssuePage() {
  const { username, repo, number } = useParams<{ username: string; repo: string; number: string }>();
  const { user } = useAuth();
  const issueNumber = parseInt(number, 10);
  const [commentBody, setCommentBody] = useState('');

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

  const issue = issueData?.getIssue;
  const comments = commentsData?.listIssueComments.comments ?? [];
  const isOwnerOrAuthor = user?.username === username || user?.username === issue?.author?.username;

  const stateColor = issue?.state === 'open' ? 'text-success-fg' : 'text-purple-fg';
  const StateIcon = issue?.state === 'open' ? CircleDot : CheckCircle2;

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
          <aside className="w-64 shrink-0 space-y-4 text-sm">
            {/* Labels */}
            <div className="border-b border-border pb-4">
              <p className="font-semibold text-fg mb-2">Labels</p>
              {issue.labels?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels.map((l) => (
                    <span
                      key={l.id}
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `#${l.color}33`, color: `#${l.color}` }}
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-fg-muted">None yet</p>
              )}
            </div>

            {/* Assignees */}
            <div className="border-b border-border pb-4">
              <p className="font-semibold text-fg mb-2">Assignees</p>
              {issue.assignees?.length > 0 ? (
                <div className="space-y-1">
                  {issue.assignees.map((a) => (
                    <div key={a.username} className="flex items-center gap-2">
                      <Avatar src={a.avatarUrl} name={a.username} size={20} />
                      <span className="text-fg">{a.username}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-fg-muted">No one assigned</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </RepoLayout>
  );
}
