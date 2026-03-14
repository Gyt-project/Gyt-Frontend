import { gql } from '@apollo/client';

// ─── Fragments ────────────────────────────────────────────────────────────────

const USER_FIELDS = `
  uuid username email displayName bio avatarUrl isAdmin createdAt
`;

const REPO_FIELDS = `
  uuid name description defaultBranch isPrivate isFork
  ownerType ownerName stars forks createdAt updatedAt
`;

const LABEL_FIELDS = `id name color description`;

const ISSUE_FIELDS = `
  id number title body state
  author { ${USER_FIELDS} }
  assignees { ${USER_FIELDS} }
  labels { ${LABEL_FIELDS} }
  commentCount createdAt updatedAt closedAt
`;

const PR_FIELDS = `
  id number title body state headBranch baseBranch headSha
  author { ${USER_FIELDS} }
  assignees { ${USER_FIELDS} }
  labels { ${LABEL_FIELDS} }
  mergeable merged commentCount commits additions deletions changedFiles
  createdAt updatedAt mergedAt
`;

const COMMIT_FIELDS = `
  sha
  author { name email when }
  committer { name email when }
  message parentShas
`;

const FILE_DIFF_FIELDS = `path additions deletions status oldPath`;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser { ${USER_FIELDS} }
  }
`;

export const GET_USER = gql`
  query GetUser($username: String!) {
    getUser(username: $username) { ${USER_FIELDS} }
  }
`;

export const LIST_USERS = gql`
  query ListUsers($page: Int, $perPage: Int) {
    listUsers(page: $page, perPage: $perPage) {
      users { ${USER_FIELDS} }
      total page perPage
    }
  }
`;

export const LIST_SSH_KEYS = gql`
  query ListSSHKeys($username: String!) {
    listSSHKeys(username: $username) {
      keys { id name publicKey createdAt }
    }
  }
`;

// ─── Repositories ─────────────────────────────────────────────────────────────

export const GET_REPOSITORY = gql`
  query GetRepository($owner: String!, $name: String!) {
    getRepository(owner: $owner, name: $name) { ${REPO_FIELDS} }
  }
`;

export const LIST_REPOSITORIES = gql`
  query ListRepositories($page: Int, $perPage: Int, $includePrivate: Boolean) {
    listRepositories(page: $page, perPage: $perPage, includePrivate: $includePrivate) {
      repositories { ${REPO_FIELDS} }
      total page perPage
    }
  }
`;

export const LIST_USER_REPOSITORIES = gql`
  query ListUserRepositories($username: String!, $page: Int, $perPage: Int) {
    listUserRepositories(username: $username, page: $page, perPage: $perPage) {
      repositories { ${REPO_FIELDS} }
      total page perPage
    }
  }
`;

export const LIST_ORG_REPOSITORIES = gql`
  query ListOrgRepositories($orgName: String!, $page: Int, $perPage: Int) {
    listOrgRepositories(orgName: $orgName, page: $page, perPage: $perPage) {
      repositories { ${REPO_FIELDS} }
      total page perPage
    }
  }
`;

// ─── Repository Content ───────────────────────────────────────────────────────

export const GET_REPO_TREE = gql`
  query GetRepoTree($owner: String!, $name: String!, $ref: String, $path: String) {
    getRepositoryTree(owner: $owner, name: $name, ref: $ref, path: $path) {
      entries { name path mode size isDir isSubmodule }
      ref
    }
  }
`;

export const GET_FILE_BLOB = gql`
  query GetFileBlob($owner: String!, $name: String!, $path: String!, $ref: String) {
    getFileBlob(owner: $owner, name: $name, path: $path, ref: $ref) {
      content size isBinary path
    }
  }
`;

export const LIST_BRANCHES = gql`
  query ListBranches($owner: String!, $name: String!) {
    listBranches(owner: $owner, name: $name) {
      branches { name fullName commitSha }
    }
  }
`;

export const GET_DEFAULT_BRANCH = gql`
  query GetDefaultBranch($owner: String!, $name: String!) {
    getDefaultBranch(owner: $owner, name: $name) { branchName }
  }
`;

export const LIST_TAGS = gql`
  query ListTags($owner: String!, $name: String!) {
    listTags(owner: $owner, name: $name) {
      tags { name fullName commitSha message }
    }
  }
`;

export const LIST_COMMITS = gql`
  query ListCommits($owner: String!, $name: String!, $ref: String, $limit: Int, $page: Int) {
    listCommits(owner: $owner, name: $name, ref: $ref, limit: $limit, page: $page) {
      commits { ${COMMIT_FIELDS} }
      page perPage hasMore
    }
  }
`;

export const GET_COMMIT = gql`
  query GetCommit($owner: String!, $name: String!, $sha: String!) {
    getCommit(owner: $owner, name: $name, sha: $sha) {
      commit { ${COMMIT_FIELDS} }
      files { ${FILE_DIFF_FIELDS} }
      totalAdditions totalDeletions filesChanged patch
    }
  }
`;

export const GET_REPO_STATS = gql`
  query GetRepoStats($owner: String!, $name: String!) {
    getRepositoryStats(owner: $owner, name: $name) {
      sizeBytes commitCount branchCount tagCount contributorCount lastCommit stars forks
    }
  }
`;

export const GET_CLONE_URLS = gql`
  query GetCloneURLs($owner: String!, $name: String!) {
    getCloneURLs(owner: $owner, name: $name) { sshUrl httpUrl gitUrl }
  }
`;

export const COMPARE_BRANCHES = gql`
  query CompareBranches($owner: String!, $name: String!, $baseBranch: String!, $headBranch: String!) {
    compareBranches(owner: $owner, name: $name, baseBranch: $baseBranch, headBranch: $headBranch) {
      commits { ${COMMIT_FIELDS} }
      files { ${FILE_DIFF_FIELDS} }
      totalAdditions totalDeletions filesChanged commitsAhead
    }
  }
`;

export const GET_FILE_HISTORY = gql`
  query GetFileHistory($owner: String!, $name: String!, $path: String!, $ref: String, $limit: Int) {
    getFileHistory(owner: $owner, name: $name, path: $path, ref: $ref, limit: $limit) {
      commits { ${COMMIT_FIELDS} }
    }
  }
`;

export const SEARCH_COMMITS = gql`
  query SearchCommits($owner: String!, $name: String!, $query: String!, $author: String, $ref: String, $limit: Int) {
    searchCommits(owner: $owner, name: $name, query: $query, author: $author, ref: $ref, limit: $limit) {
      commits { ${COMMIT_FIELDS} }
      page perPage hasMore
    }
  }
`;

export const CHECK_PATH = gql`
  query CheckPath($owner: String!, $name: String!, $path: String!, $ref: String) {
    checkPath(owner: $owner, name: $name, path: $path, ref: $ref) {
      exists isDir isFile size
    }
  }
`;

// ─── Collaborators ────────────────────────────────────────────────────────────

export const LIST_COLLABORATORS = gql`
  query ListCollaborators($owner: String!, $name: String!) {
    listCollaborators(owner: $owner, name: $name) {
      collaborators { username accessLevel }
    }
  }
`;

// ─── Organizations ────────────────────────────────────────────────────────────

export const GET_ORGANIZATION = gql`
  query GetOrganization($name: String!) {
    getOrganization(name: $name) {
      uuid name displayName description avatarUrl ownerUsername memberCount repoCount createdAt
    }
  }
`;

export const LIST_ORGANIZATIONS = gql`
  query ListOrganizations($page: Int, $perPage: Int) {
    listOrganizations(page: $page, perPage: $perPage) {
      organizations { uuid name displayName description avatarUrl ownerUsername memberCount repoCount createdAt }
      total
    }
  }
`;

export const LIST_USER_ORGANIZATIONS = gql`
  query ListUserOrganizations($username: String!) {
    listUserOrganizations(username: $username) {
      organizations { uuid name displayName description avatarUrl ownerUsername memberCount repoCount createdAt }
      total
    }
  }
`;

export const LIST_ORG_MEMBERS = gql`
  query ListOrgMembers($orgName: String!) {
    listOrgMembers(orgName: $orgName) {
      members {
        user { ${USER_FIELDS} }
        role joinedAt
      }
    }
  }
`;

export const GET_ORG_MEMBERSHIP = gql`
  query GetOrgMembership($orgName: String!, $username: String!) {
    getOrgMembership(orgName: $orgName, username: $username) {
      user { ${USER_FIELDS} }
      role joinedAt
    }
  }
`;

// ─── Stars ────────────────────────────────────────────────────────────────────

export const CHECK_STAR = gql`
  query CheckStar($owner: String!, $name: String!) {
    checkStar(owner: $owner, name: $name) { starred }
  }
`;

export const LIST_STARGAZERS = gql`
  query ListStargazers($owner: String!, $name: String!, $page: Int, $perPage: Int) {
    listStargazers(owner: $owner, name: $name, page: $page, perPage: $perPage) {
      users { ${USER_FIELDS} }
      total
    }
  }
`;

export const LIST_STARRED_REPOSITORIES = gql`
  query ListStarredRepositories($username: String!, $page: Int, $perPage: Int) {
    listStarredRepositories(username: $username, page: $page, perPage: $perPage) {
      repositories { ${REPO_FIELDS} }
      total page perPage
    }
  }
`;

// ─── Labels ───────────────────────────────────────────────────────────────────

export const LIST_LABELS = gql`
  query ListLabels($owner: String!, $repo: String!) {
    listLabels(owner: $owner, repo: $repo) {
      labels { ${LABEL_FIELDS} }
    }
  }
`;

export const GET_LABEL = gql`
  query GetLabel($owner: String!, $repo: String!, $name: String!) {
    getLabel(owner: $owner, repo: $repo, name: $name) { ${LABEL_FIELDS} }
  }
`;

// ─── Issues ───────────────────────────────────────────────────────────────────

export const GET_ISSUE = gql`
  query GetIssue($owner: String!, $repo: String!, $number: Int!) {
    getIssue(owner: $owner, repo: $repo, number: $number) { ${ISSUE_FIELDS} }
  }
`;

export const LIST_ISSUES = gql`
  query ListIssues($owner: String!, $repo: String!, $state: String, $label: String, $assignee: String, $author: String, $page: Int, $perPage: Int) {
    listIssues(owner: $owner, repo: $repo, state: $state, label: $label, assignee: $assignee, author: $author, page: $page, perPage: $perPage) {
      issues { ${ISSUE_FIELDS} }
      total page perPage
    }
  }
`;

export const LIST_ISSUE_COMMENTS = gql`
  query ListIssueComments($owner: String!, $repo: String!, $number: Int!) {
    listIssueComments(owner: $owner, repo: $repo, number: $number) {
      comments {
        id body
        author { ${USER_FIELDS} }
        createdAt updatedAt
      }
    }
  }
`;

// ─── Pull Requests ────────────────────────────────────────────────────────────

export const GET_PULL_REQUEST = gql`
  query GetPullRequest($owner: String!, $repo: String!, $number: Int!) {
    getPullRequest(owner: $owner, repo: $repo, number: $number) { ${PR_FIELDS} }
  }
`;

export const LIST_PULL_REQUESTS = gql`
  query ListPullRequests($owner: String!, $repo: String!, $state: String, $author: String, $assignee: String, $label: String, $base: String, $page: Int, $perPage: Int) {
    listPullRequests(owner: $owner, repo: $repo, state: $state, author: $author, assignee: $assignee, label: $label, base: $base, page: $page, perPage: $perPage) {
      pullRequests { ${PR_FIELDS} }
      total page perPage
    }
  }
`;

export const GET_PR_DIFF = gql`
  query GetPRDiff($owner: String!, $repo: String!, $number: Int!) {
    getPullRequestDiff(owner: $owner, repo: $repo, number: $number) {
      commits { ${COMMIT_FIELDS} }
      files { ${FILE_DIFF_FIELDS} }
      totalAdditions totalDeletions filesChanged commitsAhead
    }
  }
`;

export const LIST_PR_COMMENTS = gql`
  query ListPRComments($owner: String!, $repo: String!, $number: Int!) {
    listPRComments(owner: $owner, repo: $repo, number: $number) {
      comments {
        id body path line
        author { ${USER_FIELDS} }
        createdAt updatedAt
      }
    }
  }
`;

export const LIST_PR_REVIEWS = gql`
  query ListPRReviews($owner: String!, $repo: String!, $number: Int!) {
    listPRReviews(owner: $owner, repo: $repo, number: $number) {
      reviews {
        id state body submittedAt
        reviewer { ${USER_FIELDS} }
      }
    }
  }
`;

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export const LIST_WEBHOOKS = gql`
  query ListWebhooks($owner: String!, $repo: String) {
    listWebhooks(owner: $owner, repo: $repo) {
      webhooks { id url events active contentType createdAt updatedAt }
    }
  }
`;

export const GET_WEBHOOK = gql`
  query GetWebhook($owner: String!, $repo: String, $id: String!) {
    getWebhook(owner: $owner, repo: $repo, id: $id) {
      id url events active contentType createdAt updatedAt
    }
  }
`;

// ─── Search ───────────────────────────────────────────────────────────────────

export const SEARCH_REPOSITORIES = gql`
  query SearchRepositories($query: String!, $language: String, $sort: String, $order: String, $page: Int, $perPage: Int) {
    searchRepositories(query: $query, language: $language, sort: $sort, order: $order, page: $page, perPage: $perPage) {
      repositories { ${REPO_FIELDS} }
      total page perPage
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $sort: String, $order: String, $page: Int, $perPage: Int) {
    searchUsers(query: $query, sort: $sort, order: $order, page: $page, perPage: $perPage) {
      users { ${USER_FIELDS} }
      total page perPage
    }
  }
`;

export const SEARCH_ISSUES = gql`
  query SearchIssues($query: String!, $state: String, $type: String, $owner: String, $repo: String, $author: String, $label: String, $sort: String, $order: String, $page: Int, $perPage: Int) {
    searchIssues(query: $query, state: $state, type: $type, owner: $owner, repo: $repo, author: $author, label: $label, sort: $sort, order: $order, page: $page, perPage: $perPage) {
      issues { ${ISSUE_FIELDS} }
      total page perPage
    }
  }
`;
