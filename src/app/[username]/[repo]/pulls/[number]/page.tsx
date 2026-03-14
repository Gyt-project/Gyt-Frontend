'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  GitMerge, GitPullRequest, XCircle, CircleDot, MessageSquare,
  GitCommit, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  GET_PULL_REQUEST, GET_PR_DIFF, LIST_PR_COMMENTS, LIST_PR_REVIEWS, GET_REPOSITORY,
} from '@/graphql/queries';
import {
  MERGE_PULL_REQUEST, CLOSE_PULL_REQUEST, REOPEN_PULL_REQUEST,
  CREATE_PR_COMMENT, CREATE_PR_REVIEW, UPDATE_PR_COMMENT, DELETE_PR_COMMENT,
} from '@/graphql/mutations';
import {
  PullRequest, FileDiff, PRComment, PRReview,
  ListPRCommentsResponse, ListPRReviewsResponse, Repository,
} from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import FileDiffList from '@/components/repo/FileDiffList';
import CommentItem from '@/components/issues/CommentItem';
import ReviewItem from '@/components/pulls/ReviewItem';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function PullRequestPage() {
  const { username, repo, number } = useParams<{ username: string; repo: string; number: string }>();
  const { user } = useAuth();
  const prNumber = parseInt(number, 10);
  const [commentBody, setCommentBody] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewState, setReviewState] = useState<'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'>('COMMENTED');
  const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge');
  const [activeTab, setActiveTab] = useState<'conversation' | 'diff'>('conversation');

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data: prData, loading, refetch: refetchPR } = useQuery<{ getPullRequest: PullRequest }>(
    GET_PULL_REQUEST,
    { variables: { owner: username, repo, number: prNumber } }
  );
  const { data: diffData, loading: loadingDiff } = useQuery<{ getPRDiff: FileDiff[] }>(
    GET_PR_DIFF,
    { variables: { owner: username, repo, number: prNumber }, skip: activeTab !== 'diff' }
  );
  const { data: commentsData, refetch: refetchComments } = useQuery<{
    listPRComments: ListPRCommentsResponse;
  }>(LIST_PR_COMMENTS, { variables: { owner: username, repo, number: prNumber } });
  const { data: reviewsData, refetch: refetchReviews } = useQuery<{
    listPRReviews: ListPRReviewsResponse;
  }>(LIST_PR_REVIEWS, { variables: { owner: username, repo, number: prNumber } });

  const [mergePR, { loading: merging }] = useMutation(MERGE_PULL_REQUEST, {
    onCompleted: () => refetchPR(),
  });
  const [closePR, { loading: closing }] = useMutation(CLOSE_PULL_REQUEST, {
    onCompleted: () => refetchPR(),
  });
  const [reopenPR, { loading: reopening }] = useMutation(REOPEN_PULL_REQUEST, {
    onCompleted: () => refetchPR(),
  });
  const [createComment, { loading: commenting }] = useMutation(CREATE_PR_COMMENT, {
    onCompleted: () => { setCommentBody(''); refetchComments(); },
  });
  const [updateComment] = useMutation(UPDATE_PR_COMMENT, { onCompleted: () => refetchComments() });
  const [deleteComment] = useMutation(DELETE_PR_COMMENT, { onCompleted: () => refetchComments() });
  const [submitReview, { loading: submittingReview }] = useMutation(CREATE_PR_REVIEW, {
    onCompleted: () => { setReviewBody(''); refetchReviews(); },
  });

  const pr = prData?.getPullRequest;
  const comments = commentsData?.listPRComments.comments ?? [];
  const reviews = reviewsData?.listPRReviews.reviews ?? [];
  const isRepoOwner = user?.username === username;

  const stateInfo = pr
    ? pr.merged
      ? { icon: <GitMerge size={16} />, label: 'Merged', cls: 'text-purple-fg' }
      : pr.state === 'open'
      ? { icon: <CircleDot size={16} />, label: 'Open', cls: 'text-success-fg' }
      : { icon: <XCircle size={16} />, label: 'Closed', cls: 'text-danger-fg' }
    : null;

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !pr ? (
        <p className="text-center text-fg-muted py-12">Pull request not found.</p>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-fg">
              {pr.title} <span className="text-fg-muted font-normal">#{pr.number}</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              {stateInfo && (
                <span className={`flex items-center gap-1 font-medium ${stateInfo.cls}`}>
                  {stateInfo.icon} {stateInfo.label}
                </span>
              )}
              <span>
                {pr.author?.username} wants to merge{' '}
                <code className="bg-canvas-subtle px-1 rounded text-xs">{pr.headBranch}</code>
                {' → '}
                <code className="bg-canvas-subtle px-1 rounded text-xs">{pr.baseBranch}</code>
              </span>
              <span>· {formatRelativeTime(pr.createdAt)}</span>
            </div>

            {/* Stats */}
            <div className="flex gap-3 text-xs text-fg-muted pt-1">
              <span className="flex items-center gap-1"><GitCommit size={12} /> {pr.commits} commit{pr.commits !== 1 ? 's' : ''}</span>
              <span className="text-success-fg">+{pr.additions}</span>
              <span className="text-danger-fg">-{pr.deletions}</span>
              <span>{pr.changedFiles} file{pr.changedFiles !== 1 ? 's' : ''} changed</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border gap-4 text-sm">
            {['conversation', 'diff'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`pb-2 capitalize font-medium border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-accent text-fg'
                    : 'border-transparent text-fg-muted hover:text-fg'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'conversation' ? (
            <div className="flex gap-6">
              <div className="flex-1 min-w-0 space-y-4">
                {/* Body */}
                {pr.body && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <div className="flex items-center gap-2 bg-canvas-overlay px-4 py-2.5 border-b border-border text-sm">
                      <Avatar src={pr.author?.avatarUrl} name={pr.author?.username ?? ''} size={20} />
                      <span className="font-medium text-fg">{pr.author?.username}</span>
                      <span className="text-fg-muted">commented {formatRelativeTime(pr.createdAt)}</span>
                    </div>
                    <div className="px-4 py-4">
                      <MarkdownRenderer>{pr.body}</MarkdownRenderer>
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {reviews.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}

                {/* Comments */}
                {comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={{ id: c.id, body: c.body, author: c.author, createdAt: c.createdAt, updatedAt: c.updatedAt }}
                    currentUsername={user?.username}
                    onUpdate={(id, body) =>
                      updateComment({ variables: { owner: username, repo, commentId: id, body } })
                    }
                    onDelete={(id) =>
                      deleteComment({ variables: { owner: username, repo, commentId: id } })
                    }
                  />
                ))}

                {/* Merge box */}
                {isRepoOwner && pr.state === 'open' && !pr.merged && (
                  <div className="border border-border rounded-md p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      {pr.mergeable ? (
                        <><CheckCircle2 size={16} className="text-success-fg" /><span className="text-fg">This branch has no conflicts with the base branch.</span></>
                      ) : (
                        <><AlertCircle size={16} className="text-warning-fg" /><span className="text-fg">This branch has conflicts that must be resolved.</span></>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={mergeMethod}
                        onChange={(e) => setMergeMethod(e.target.value as typeof mergeMethod)}
                        className="bg-canvas border border-border rounded-l-md px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="merge">Create a merge commit</option>
                        <option value="squash">Squash and merge</option>
                        <option value="rebase">Rebase and merge</option>
                      </select>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={merging}
                        disabled={!pr.mergeable}
                        onClick={() =>
                          mergePR({
                            variables: {
                              input: { owner: username, name: repo, number: prNumber, mergeMethod },
                            },
                          })
                        }
                      >
                        <GitMerge size={13} className="mr-1" /> Merge pull request
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={closing}
                        onClick={() => closePR({ variables: { owner: username, repo, number: prNumber } })}
                      >
                        Close PR
                      </Button>
                    </div>
                  </div>
                )}

                {pr.state === 'closed' && !pr.merged && isRepoOwner && (
                  <div className="border border-border rounded-md p-4">
                    <Button
                      size="sm"
                      loading={reopening}
                      onClick={() => reopenPR({ variables: { owner: username, repo, number: prNumber } })}
                    >
                      Reopen pull request
                    </Button>
                  </div>
                )}

                {/* Add comment */}
                {user && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <div className="bg-canvas-overlay px-4 py-2.5 border-b border-border text-sm font-medium text-fg">
                      Leave a comment
                    </div>
                    <div className="p-4 space-y-3">
                      <Textarea
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Write a comment…"
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={commenting}
                          disabled={!commentBody.trim()}
                          onClick={() =>
                            createComment({
                              variables: {
                                input: { owner: username, name: repo, number: prNumber, body: commentBody },
                              },
                            })
                          }
                        >
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit review */}
                {user && pr.state === 'open' && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <div className="bg-canvas-overlay px-4 py-2.5 border-b border-border text-sm font-medium text-fg">
                      Submit a review
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex gap-3 text-sm">
                        {(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'] as const).map((s) => (
                          <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="reviewState"
                              checked={reviewState === s}
                              onChange={() => setReviewState(s)}
                              className="accent-accent"
                            />
                            <span className="text-fg">{s.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                      <Textarea
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        placeholder="Leave a review comment…"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={submittingReview}
                          disabled={!reviewBody.trim()}
                          onClick={() =>
                            submitReview({
                              variables: {
                                input: {
                                  owner: username,
                                  name: repo,
                                  number: prNumber,
                                  state: reviewState,
                                  body: reviewBody,
                                },
                              },
                            })
                          }
                        >
                          Submit review
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {!user && (
                  <div className="border border-border rounded-md p-4 text-center text-sm text-fg-muted">
                    <Link href="/login" className="text-accent-fg hover:underline font-medium">Sign in</Link>
                    {' '}to comment or review.
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="w-64 shrink-0 space-y-4 text-sm">
                <div className="border-b border-border pb-4">
                  <p className="font-semibold text-fg mb-2">Reviewers</p>
                  {reviews.length ? (
                    <div className="space-y-1">
                      {reviews.map((r) => (
                        <div key={r.id} className="flex items-center gap-2">
                          <Avatar src={r.reviewer?.avatarUrl} name={r.reviewer?.username ?? ''} size={20} />
                          <span className="text-fg">{r.reviewer?.username}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-fg-muted">No reviews yet</p>}
                </div>
                <div className="border-b border-border pb-4">
                  <p className="font-semibold text-fg mb-2">Labels</p>
                  {pr.labels?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {pr.labels.map((l) => (
                        <span
                          key={l.id}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `#${l.color}33`, color: `#${l.color}` }}
                        >
                          {l.name}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-fg-muted">None yet</p>}
                </div>
              </aside>
            </div>
          ) : (
            <div>
              {loadingDiff ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
              ) : (
                <FileDiffList files={diffData?.getPRDiff ?? []} />
              )}
            </div>
          )}
        </div>
      )}
    </RepoLayout>
  );
}
