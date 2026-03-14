// GraphQL scalar
export type Time = string;

// ─── Auth ────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// ─── Users ───────────────────────────────────────────────────

export interface User {
  uuid: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  isAdmin: boolean;
  createdAt: Time;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
  page: number;
  perPage: number;
}

export interface SSHKey {
  id: string;
  name: string;
  publicKey: string;
  createdAt: Time;
}

export interface ListSSHKeysResponse {
  keys: SSHKey[];
}

// ─── Repositories ────────────────────────────────────────────

export interface Repository {
  uuid: string;
  name: string;
  description: string;
  defaultBranch: string;
  isPrivate: boolean;
  isFork: boolean;
  ownerType: string;
  ownerName: string;
  stars: number;
  forks: number;
  createdAt: Time;
  updatedAt: Time;
}

export interface ListReposResponse {
  repositories: Repository[];
  total: number;
  page: number;
  perPage: number;
}

export interface TreeEntry {
  name: string;
  path: string;
  mode: string;
  size: number;
  isDir: boolean;
  isSubmodule: boolean;
}

export interface RepoTreeResponse {
  entries: TreeEntry[];
  ref: string;
}

export interface FileBlob {
  content: string;
  size: number;
  isBinary: boolean;
  path: string;
}

export interface Branch {
  name: string;
  fullName: string;
  commitSha: string;
}

export interface ListBranchesResponse {
  branches: Branch[];
}

export interface DefaultBranchResponse {
  branchName: string;
}

export interface Tag {
  name: string;
  fullName: string;
  commitSha: string;
  message?: string;
}

export interface ListTagsResponse {
  tags: Tag[];
}

export interface Author {
  name: string;
  email: string;
  when: Time;
}

export interface Commit {
  sha: string;
  author: Author;
  committer: Author;
  message: string;
  parentShas: string[];
}

export interface TagDetail {
  tag: Tag;
  commit: Commit;
}

export interface ListCommitsResponse {
  commits: Commit[];
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  status: string;
  oldPath?: string;
}

export interface CommitDetail {
  commit: Commit;
  files: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
  filesChanged: number;
  patch: string;
}

export interface RepoStats {
  sizeBytes: number;
  commitCount: number;
  branchCount: number;
  tagCount: number;
  contributorCount: number;
  lastCommit: Time;
  stars: number;
  forks: number;
}

export interface CloneURLs {
  sshUrl: string;
  httpUrl: string;
  gitUrl: string;
}

export interface CompareResponse {
  commits: Commit[];
  files: FileDiff[];
  totalAdditions: number;
  totalDeletions: number;
  filesChanged: number;
  commitsAhead: number;
}

export interface Collaborator {
  username: string;
  accessLevel: string;
}

export interface ListCollaboratorsResponse {
  collaborators: Collaborator[];
}

// ─── Organizations ───────────────────────────────────────────

export interface Organization {
  uuid: string;
  name: string;
  displayName: string;
  description: string;
  avatarUrl: string;
  ownerUsername: string;
  memberCount: number;
  repoCount: number;
  createdAt: Time;
}

export interface ListOrgsResponse {
  organizations: Organization[];
  total: number;
}

export interface OrgMember {
  user: User;
  role: string;
  joinedAt: Time;
}

export interface ListOrgMembersResponse {
  members: OrgMember[];
}

// ─── Stars ───────────────────────────────────────────────────

export interface ListStargazersResponse {
  users: User[];
  total: number;
}

export interface CheckStarResponse {
  starred: boolean;
}

// ─── Labels ──────────────────────────────────────────────────

export interface Label {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface ListLabelsResponse {
  labels: Label[];
}

// ─── Issues ──────────────────────────────────────────────────

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: string;
  author: User;
  assignees: User[];
  labels: Label[];
  commentCount: number;
  createdAt: Time;
  updatedAt: Time;
  closedAt?: Time;
}

export interface IssueComment {
  id: string;
  body: string;
  author: User;
  createdAt: Time;
  updatedAt: Time;
}

export interface ListIssuesResponse {
  issues: Issue[];
  total: number;
  page: number;
  perPage: number;
}

export interface ListIssueCommentsResponse {
  comments: IssueComment[];
}

// ─── Pull Requests ───────────────────────────────────────────

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  state: string;
  headBranch: string;
  baseBranch: string;
  headSha: string;
  author: User;
  assignees: User[];
  labels: Label[];
  mergeable: boolean;
  merged: boolean;
  commentCount: number;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: Time;
  updatedAt: Time;
  mergedAt?: Time;
}

export interface MergePRResponse {
  merged: boolean;
  sha: string;
  message: string;
}

export interface PRComment {
  id: string;
  body: string;
  author: User;
  path?: string;
  line?: number;
  createdAt: Time;
  updatedAt: Time;
}

export interface PRReview {
  id: string;
  reviewer: User;
  state: string;
  body: string;
  submittedAt: Time;
}

export interface ListPRsResponse {
  pullRequests: PullRequest[];
  total: number;
  page: number;
  perPage: number;
}

export interface ListPRCommentsResponse {
  comments: PRComment[];
}

export interface ListPRReviewsResponse {
  reviews: PRReview[];
}

// ─── Webhooks ────────────────────────────────────────────────

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  contentType: string;
  createdAt: Time;
  updatedAt: Time;
}

export interface ListWebhooksResponse {
  webhooks: Webhook[];
}
