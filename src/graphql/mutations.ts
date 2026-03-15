import { gql } from '@apollo/client';

const USER_FIELDS = `uuid username email displayName bio avatarUrl isAdmin createdAt`;
const REPO_FIELDS = `uuid name description defaultBranch isPrivate isFork ownerType ownerName stars forks createdAt updatedAt`;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken refreshToken expiresIn
      user { ${USER_FIELDS} }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken refreshToken expiresIn
      user { ${USER_FIELDS} }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken refreshToken expiresIn
      user { ${USER_FIELDS} }
    }
  }
`;

// ─── Users ────────────────────────────────────────────────────────────────────

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) { ${USER_FIELDS} }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($username: String!) {
    deleteUser(username: $username)
  }
`;

// ─── SSH Keys ─────────────────────────────────────────────────────────────────

export const ADD_SSH_KEY = gql`
  mutation AddSSHKey($input: AddSSHKeyInput!) {
    addSSHKey(input: $input) { id name publicKey createdAt }
  }
`;

export const DELETE_SSH_KEY = gql`
  mutation DeleteSSHKey($keyId: String!) {
    deleteSSHKey(keyId: $keyId)
  }
`;

// ─── Repositories ─────────────────────────────────────────────────────────────

export const CREATE_REPOSITORY = gql`
  mutation CreateRepository($input: CreateRepoInput!) {
    createRepository(input: $input) { ${REPO_FIELDS} }
  }
`;

export const UPDATE_REPOSITORY = gql`
  mutation UpdateRepository($input: UpdateRepoInput!) {
    updateRepository(input: $input) { ${REPO_FIELDS} }
  }
`;

export const DELETE_REPOSITORY = gql`
  mutation DeleteRepository($owner: String!, $name: String!) {
    deleteRepository(owner: $owner, name: $name)
  }
`;

export const RENAME_REPOSITORY = gql`
  mutation RenameRepository($input: RenameRepoInput!) {
    renameRepository(input: $input) { ${REPO_FIELDS} }
  }
`;

// ─── Repo Content ─────────────────────────────────────────────────────────────

export const SET_DEFAULT_BRANCH = gql`
  mutation SetDefaultBranch($owner: String!, $name: String!, $branchName: String!) {
    setDefaultBranch(owner: $owner, name: $name, branchName: $branchName) { branchName }
  }
`;

export const CREATE_BRANCH = gql`
  mutation CreateBranch($owner: String!, $name: String!, $branchName: String!, $source: String!) {
    createBranch(owner: $owner, name: $name, branchName: $branchName, source: $source) {
      name fullName commitSha
    }
  }
`;

export const DELETE_BRANCH = gql`
  mutation DeleteBranch($owner: String!, $name: String!, $branchName: String!) {
    deleteBranch(owner: $owner, name: $name, branchName: $branchName)
  }
`;

export const CREATE_TAG = gql`
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      tag { name fullName commitSha message }
      commit { sha message author { name email when } committer { name email when } parentShas }
    }
  }
`;

export const DELETE_TAG = gql`
  mutation DeleteTag($owner: String!, $name: String!, $tagName: String!) {
    deleteTag(owner: $owner, name: $name, tagName: $tagName)
  }
`;

// ─── Collaborators ────────────────────────────────────────────────────────────

export const ADD_COLLABORATOR = gql`
  mutation AddCollaborator($input: AddCollaboratorInput!) {
    addCollaborator(input: $input)
  }
`;

export const REMOVE_COLLABORATOR = gql`
  mutation RemoveCollaborator($owner: String!, $name: String!, $username: String!) {
    removeCollaborator(owner: $owner, name: $name, username: $username)
  }
`;

export const UPDATE_COLLABORATOR = gql`
  mutation UpdateCollaborator($input: UpdateCollaboratorInput!) {
    updateCollaborator(input: $input)
  }
`;

// ─── Organizations ────────────────────────────────────────────────────────────

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrgInput!) {
    createOrganization(input: $input) {
      uuid name displayName description avatarUrl ownerUsername memberCount repoCount createdAt
    }
  }
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($input: UpdateOrgInput!) {
    updateOrganization(input: $input) {
      uuid name displayName description avatarUrl ownerUsername memberCount repoCount createdAt
    }
  }
`;

export const DELETE_ORGANIZATION = gql`
  mutation DeleteOrganization($name: String!) {
    deleteOrganization(name: $name)
  }
`;

export const ADD_ORG_MEMBER = gql`
  mutation AddOrgMember($input: AddOrgMemberInput!) {
    addOrgMember(input: $input) {
      user { ${USER_FIELDS} }
      role joinedAt
    }
  }
`;

export const UPDATE_ORG_MEMBER = gql`
  mutation UpdateOrgMember($input: UpdateOrgMemberInput!) {
    updateOrgMember(input: $input) {
      user { ${USER_FIELDS} }
      role joinedAt
    }
  }
`;

export const REMOVE_ORG_MEMBER = gql`
  mutation RemoveOrgMember($orgName: String!, $username: String!) {
    removeOrgMember(orgName: $orgName, username: $username)
  }
`;

// ─── Stars ────────────────────────────────────────────────────────────────────

export const STAR_REPOSITORY = gql`
  mutation StarRepository($owner: String!, $name: String!) {
    starRepository(owner: $owner, name: $name)
  }
`;

export const UNSTAR_REPOSITORY = gql`
  mutation UnstarRepository($owner: String!, $name: String!) {
    unstarRepository(owner: $owner, name: $name)
  }
`;

// ─── Labels ───────────────────────────────────────────────────────────────────

export const CREATE_LABEL = gql`
  mutation CreateLabel($input: CreateLabelInput!) {
    createLabel(input: $input) { id name color description }
  }
`;

export const UPDATE_LABEL = gql`
  mutation UpdateLabel($input: UpdateLabelInput!) {
    updateLabel(input: $input) { id name color description }
  }
`;

export const DELETE_LABEL = gql`
  mutation DeleteLabel($owner: String!, $repo: String!, $name: String!) {
    deleteLabel(owner: $owner, repo: $repo, name: $name)
  }
`;

// ─── Issues ───────────────────────────────────────────────────────────────────

export const CREATE_ISSUE = gql`
  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) {
      id number title state createdAt
    }
  }
`;

export const UPDATE_ISSUE = gql`
  mutation UpdateIssue($input: UpdateIssueInput!) {
    updateIssue(input: $input) {
      id number title body state createdAt updatedAt
    }
  }
`;

export const CLOSE_ISSUE = gql`
  mutation CloseIssue($owner: String!, $repo: String!, $number: Int!) {
    closeIssue(owner: $owner, repo: $repo, number: $number) {
      id number state closedAt
    }
  }
`;

export const REOPEN_ISSUE = gql`
  mutation ReopenIssue($owner: String!, $repo: String!, $number: Int!) {
    reopenIssue(owner: $owner, repo: $repo, number: $number) {
      id number state
    }
  }
`;

export const ADD_ISSUE_LABEL = gql`
  mutation AddIssueLabel($owner: String!, $repo: String!, $number: Int!, $labelName: String!) {
    addIssueLabel(owner: $owner, repo: $repo, number: $number, labelName: $labelName)
  }
`;

export const REMOVE_ISSUE_LABEL = gql`
  mutation RemoveIssueLabel($owner: String!, $repo: String!, $number: Int!, $labelName: String!) {
    removeIssueLabel(owner: $owner, repo: $repo, number: $number, labelName: $labelName)
  }
`;

export const ADD_ISSUE_ASSIGNEE = gql`
  mutation AddIssueAssignee($owner: String!, $repo: String!, $number: Int!, $username: String!) {
    addIssueAssignee(owner: $owner, repo: $repo, number: $number, username: $username)
  }
`;

export const REMOVE_ISSUE_ASSIGNEE = gql`
  mutation RemoveIssueAssignee($owner: String!, $repo: String!, $number: Int!, $username: String!) {
    removeIssueAssignee(owner: $owner, repo: $repo, number: $number, username: $username)
  }
`;

export const CREATE_ISSUE_COMMENT = gql`
  mutation CreateIssueComment($owner: String!, $repo: String!, $number: Int!, $body: String!) {
    createIssueComment(owner: $owner, repo: $repo, number: $number, body: $body) {
      id body author { uuid username displayName avatarUrl createdAt email bio isAdmin }
      createdAt updatedAt
    }
  }
`;

export const UPDATE_ISSUE_COMMENT = gql`
  mutation UpdateIssueComment($owner: String!, $repo: String!, $commentId: String!, $body: String!) {
    updateIssueComment(owner: $owner, repo: $repo, commentId: $commentId, body: $body) {
      id body createdAt updatedAt
    }
  }
`;

export const DELETE_ISSUE_COMMENT = gql`
  mutation DeleteIssueComment($owner: String!, $repo: String!, $commentId: String!) {
    deleteIssueComment(owner: $owner, repo: $repo, commentId: $commentId)
  }
`;

// ─── Pull Requests ────────────────────────────────────────────────────────────

export const CREATE_PULL_REQUEST = gql`
  mutation CreatePullRequest($input: CreatePRInput!) {
    createPullRequest(input: $input) {
      id number title state headBranch baseBranch createdAt
    }
  }
`;

export const UPDATE_PULL_REQUEST = gql`
  mutation UpdatePullRequest($input: UpdatePRInput!) {
    updatePullRequest(input: $input) {
      id number title body state baseBranch headBranch
    }
  }
`;

export const MERGE_PULL_REQUEST = gql`
  mutation MergePullRequest($input: MergePRInput!) {
    mergePullRequest(input: $input) { merged sha message }
  }
`;

export const CLOSE_PULL_REQUEST = gql`
  mutation ClosePullRequest($owner: String!, $repo: String!, $number: Int!) {
    closePullRequest(owner: $owner, repo: $repo, number: $number) {
      id number state
    }
  }
`;

export const REOPEN_PULL_REQUEST = gql`
  mutation ReopenPullRequest($owner: String!, $repo: String!, $number: Int!) {
    reopenPullRequest(owner: $owner, repo: $repo, number: $number) {
      id number state
    }
  }
`;

export const ADD_PR_LABEL = gql`
  mutation AddPRLabel($owner: String!, $repo: String!, $number: Int!, $labelName: String!) {
    addPRLabel(owner: $owner, repo: $repo, number: $number, labelName: $labelName)
  }
`;

export const REMOVE_PR_LABEL = gql`
  mutation RemovePRLabel($owner: String!, $repo: String!, $number: Int!, $labelName: String!) {
    removePRLabel(owner: $owner, repo: $repo, number: $number, labelName: $labelName)
  }
`;

export const CREATE_PR_COMMENT = gql`
  mutation CreatePRComment($input: CreatePRCommentInput!) {
    createPRComment(input: $input) {
      id body path line
      author { uuid username displayName avatarUrl createdAt email bio isAdmin }
      createdAt updatedAt
    }
  }
`;

export const UPDATE_PR_COMMENT = gql`
  mutation UpdatePRComment($owner: String!, $repo: String!, $commentId: String!, $body: String!) {
    updatePRComment(owner: $owner, repo: $repo, commentId: $commentId, body: $body) {
      id body createdAt updatedAt
    }
  }
`;

export const DELETE_PR_COMMENT = gql`
  mutation DeletePRComment($owner: String!, $repo: String!, $commentId: String!) {
    deletePRComment(owner: $owner, repo: $repo, commentId: $commentId)
  }
`;

export const CREATE_PR_REVIEW = gql`
  mutation CreatePRReview($input: CreatePRReviewInput!) {
    createPRReview(input: $input) {
      id state body submittedAt
      reviewer { uuid username displayName avatarUrl createdAt email bio isAdmin }
    }
  }
`;

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export const CREATE_WEBHOOK = gql`
  mutation CreateWebhook($input: CreateWebhookInput!) {
    createWebhook(input: $input) { id url events active contentType createdAt updatedAt }
  }
`;

export const UPDATE_WEBHOOK = gql`
  mutation UpdateWebhook($input: UpdateWebhookInput!) {
    updateWebhook(input: $input) { id url events active contentType createdAt updatedAt }
  }
`;

export const DELETE_WEBHOOK = gql`
  mutation DeleteWebhook($owner: String!, $repo: String, $id: String!) {
    deleteWebhook(owner: $owner, repo: $repo, id: $id)
  }
`;

export const PING_WEBHOOK = gql`
  mutation PingWebhook($owner: String!, $repo: String, $id: String!) {
    pingWebhook(owner: $owner, repo: $repo, id: $id)
  }
`;
