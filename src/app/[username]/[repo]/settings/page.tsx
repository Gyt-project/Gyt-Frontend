'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { Settings, Users, Webhook, AlertTriangle, Plus, Trash2, RefreshCw, Send } from 'lucide-react';
import {
  GET_REPOSITORY, LIST_BRANCHES, LIST_COLLABORATORS, LIST_WEBHOOKS,
} from '@/graphql/queries';
import {
  UPDATE_REPOSITORY, DELETE_REPOSITORY, RENAME_REPOSITORY, SET_DEFAULT_BRANCH,
  ADD_COLLABORATOR, REMOVE_COLLABORATOR, UPDATE_COLLABORATOR,
  CREATE_WEBHOOK, UPDATE_WEBHOOK, DELETE_WEBHOOK, PING_WEBHOOK,
} from '@/graphql/mutations';
import {
  Repository, Collaborator, Webhook as WebhookType, ListCollaboratorsResponse,
  ListBranchesResponse, ListWebhooksResponse,
} from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

const SECTIONS = ['General', 'Collaborators', 'Webhooks', 'Danger Zone'] as const;
type Section = typeof SECTIONS[number];

export default function RepoSettingsPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('General');

  // Redirect non-owners
  useEffect(() => {
    if (user && user.username !== username) router.push(`/${username}/${repo}`);
  }, [user, username, repo, router]);

  const { data: repoData, loading: repoLoading, refetch: refetchRepo } = useQuery<{
    getRepository: Repository;
  }>(GET_REPOSITORY, { variables: { owner: username, name: repo } });

  const { data: branchesData } = useQuery<{ listBranches: ListBranchesResponse }>(LIST_BRANCHES, {
    variables: { owner: username, name: repo },
  });
  const { data: collabData, refetch: refetchCollabs } = useQuery<{
    listCollaborators: ListCollaboratorsResponse;
  }>(LIST_COLLABORATORS, {
    variables: { owner: username, name: repo },
    skip: section !== 'Collaborators',
  });
  const { data: webhooksData, refetch: refetchWebhooks } = useQuery<{
    listWebhooks: ListWebhooksResponse;
  }>(LIST_WEBHOOKS, {
    variables: { owner: username, repo },
    skip: section !== 'Webhooks',
  });

  const repository = repoData?.getRepository;
  const branches = branchesData?.listBranches.branches ?? [];

  return (
    <RepoLayout owner={username} repo={repo} repository={repository}>
      {repoLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-48 shrink-0">
            <ul className="space-y-1">
              {SECTIONS.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => setSection(s)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      section === s
                        ? 'bg-accent-muted text-accent-fg'
                        : 'text-fg-muted hover:text-fg hover:bg-canvas-subtle'
                    }`}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {section === 'General' && repository && (
              <GeneralSection
                repository={repository}
                branches={branches.map((b) => b.name)}
                onSaved={refetchRepo}
              />
            )}
            {section === 'Collaborators' && (
              <CollaboratorsSection
                owner={username}
                repo={repo}
                collaborators={collabData?.listCollaborators.collaborators ?? []}
                onChanged={refetchCollabs}
              />
            )}
            {section === 'Webhooks' && (
              <WebhooksSection
                owner={username}
                repo={repo}
                webhooks={webhooksData?.listWebhooks.webhooks ?? []}
                onChanged={refetchWebhooks}
              />
            )}
            {section === 'Danger Zone' && repository && (
              <DangerSection owner={username} repo={repo} repository={repository} />
            )}
          </div>
        </div>
      )}
    </RepoLayout>
  );
}

// ─── General ─────────────────────────────────────────────────────────────────

function GeneralSection({
  repository,
  branches,
  onSaved,
}: {
  repository: Repository;
  branches: string[];
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(repository.description ?? '');
  const [isPrivate, setIsPrivate] = useState(repository.isPrivate);
  const [defaultBranch, setDefaultBranch] = useState(repository.defaultBranch ?? 'main');

  const [updateRepo, { loading: saving }] = useMutation(UPDATE_REPOSITORY, {
    onCompleted: () => onSaved(),
  });
  const [setDefault, { loading: settingBranch }] = useMutation(SET_DEFAULT_BRANCH, {
    onCompleted: () => onSaved(),
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-fg mb-4 flex items-center gap-2">
          <Settings size={18} /> General settings
        </h2>
        <div className="space-y-4 max-w-lg">
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description of the repo"
          />
          <div>
            <p className="text-sm text-fg-muted mb-2">Visibility</p>
            <div className="flex gap-4 text-sm">
              {[false, true].map((val) => (
                <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isPrivate === val}
                    onChange={() => setIsPrivate(val)}
                    className="accent-accent"
                  />
                  <span className="text-fg">{val ? 'Private' : 'Public'}</span>
                </label>
              ))}
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={() =>
              updateRepo({
                variables: {
                  input: {
                    owner: repository.ownerName,
                    name: repository.name,
                    description,
                    isPrivate,
                  },
                },
              })
            }
          >
            Save changes
          </Button>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-fg mb-3">Default branch</h3>
        <div className="flex items-center gap-3 max-w-lg">
          <select
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            className="flex-1 bg-canvas border border-border rounded-md px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <Button
            size="sm"
            loading={settingBranch}
            onClick={() =>
              setDefault({
                variables: {
                  owner: repository.ownerName,
                  name: repository.name,
                  branchName: defaultBranch,
                },
              })
            }
          >
            Update
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─── Collaborators ────────────────────────────────────────────────────────────

function CollaboratorsSection({
  owner,
  repo,
  collaborators,
  onChanged,
}: {
  owner: string;
  repo: string;
  collaborators: Collaborator[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [accessLevel, setAccessLevel] = useState('read');

  const [addCollab, { loading: adding }] = useMutation(ADD_COLLABORATOR, {
    onCompleted: () => { onChanged(); setShowAdd(false); setNewUsername(''); },
  });
  const [removeCollab] = useMutation(REMOVE_COLLABORATOR, { onCompleted: onChanged });
  const [updateCollab] = useMutation(UPDATE_COLLABORATOR, { onCompleted: onChanged });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
          <Users size={18} /> Collaborators
        </h2>
        <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(true)}>
          Add collaborator
        </Button>
      </div>

      {collaborators.length === 0 ? (
        <p className="text-sm text-fg-muted">No collaborators yet.</p>
      ) : (
        <div className="border border-border rounded-md divide-y divide-border">
          {collaborators.map((c) => (
            <div key={c.username} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-fg font-medium">{c.username}</span>
                <Badge>{c.accessLevel}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <select
                  defaultValue={c.accessLevel}
                  onChange={(e) =>
                    updateCollab({
                      variables: {
                        input: {
                          owner,
                          name: repo,
                          username: c.username,
                          accessLevel: e.target.value,
                        },
                      },
                    })
                  }
                  className="bg-canvas border border-border rounded px-2 py-1 text-xs text-fg focus:outline-none"
                >
                  {['read', 'write', 'admin'].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    removeCollab({ variables: { owner, name: repo, username: c.username } })
                  }
                  className="text-fg-muted hover:text-danger-fg p-1 rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add collaborator" size="sm">
        <div className="space-y-4">
          <Input
            label="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter username"
          />
          <div>
            <p className="text-sm text-fg-muted mb-2">Access level</p>
            <div className="flex gap-4 text-sm">
              {['read', 'write', 'admin'].map((lvl) => (
                <label key={lvl} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={accessLevel === lvl}
                    onChange={() => setAccessLevel(lvl)}
                    className="accent-accent"
                  />
                  <span className="text-fg">{lvl}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={adding}
              disabled={!newUsername.trim()}
              onClick={() =>
                addCollab({
                  variables: {
                    input: { owner, name: repo, username: newUsername, accessLevel },
                  },
                })
              }
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = ['push', 'pull_request', 'issues', 'release', 'create', 'delete', 'fork', 'star'];

function WebhooksSection({
  owner,
  repo,
  webhooks,
  onChanged,
}: {
  owner: string;
  repo: string;
  webhooks: WebhookType[];
  onChanged: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['push']);
  const [contentType, setContentType] = useState('json');

  const [createWebhook, { loading: creating }] = useMutation(CREATE_WEBHOOK, {
    onCompleted: () => { onChanged(); setShowCreate(false); setUrl(''); setEvents(['push']); },
  });
  const [deleteWebhook] = useMutation(DELETE_WEBHOOK, { onCompleted: onChanged });
  const [pingWebhook] = useMutation(PING_WEBHOOK);

  const toggleEvent = (e: string) =>
    setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
          <Webhook size={18} /> Webhooks
        </h2>
        <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowCreate(true)}>
          Add webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <p className="text-sm text-fg-muted">No webhooks configured.</p>
      ) : (
        <div className="border border-border rounded-md divide-y divide-border">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-fg truncate">{wh.url}</p>
                <p className="text-xs text-fg-muted">{wh.events.join(', ')}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Badge variant={wh.active ? 'success' : 'default'}>
                  {wh.active ? 'active' : 'inactive'}
                </Badge>
                <button
                  onClick={() => pingWebhook({ variables: { owner, repo, id: wh.id } })}
                  className="text-fg-muted hover:text-fg p-1 rounded"
                  title="Ping"
                >
                  <Send size={13} />
                </button>
                <button
                  onClick={() => deleteWebhook({ variables: { owner, repo, id: wh.id } })}
                  className="text-fg-muted hover:text-danger-fg p-1 rounded"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add webhook" size="md">
        <div className="space-y-4">
          <Input
            label="Payload URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
          />
          <div>
            <p className="text-sm text-fg-muted mb-2">Content type</p>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="bg-canvas border border-border rounded-md px-3 py-2 text-sm text-fg focus:outline-none"
            >
              <option value="json">application/json</option>
              <option value="form">application/x-www-form-urlencoded</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-fg-muted mb-2">Events</p>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((e) => (
                <label key={e} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={events.includes(e)}
                    onChange={() => toggleEvent(e)}
                    className="accent-accent"
                  />
                  <span className="text-fg">{e}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={!url.trim() || events.length === 0}
              onClick={() =>
                createWebhook({
                  variables: {
                    input: { owner, repo, url, events, contentType, active: true },
                  },
                })
              }
            >
              Create webhook
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Danger Zone ─────────────────────────────────────────────────────────────

function DangerSection({
  owner,
  repo,
  repository,
}: {
  owner: string;
  repo: string;
  repository: Repository;
}) {
  const router = useRouter();
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmName, setConfirmName] = useState('');

  const [renameRepo, { loading: renaming }] = useMutation(RENAME_REPOSITORY, {
    onCompleted: (data) => {
      router.push(`/${owner}/${data.renameRepository.name}/settings`);
    },
  });
  const [deleteRepo, { loading: deleting }] = useMutation(DELETE_REPOSITORY, {
    onCompleted: () => router.push(`/${owner}`),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-danger-fg flex items-center gap-2">
        <AlertTriangle size={18} /> Danger Zone
      </h2>

      <div className="border border-danger-fg/30 rounded-md divide-y divide-danger-fg/20">
        {/* Rename */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-fg">Rename this repository</p>
            <p className="text-xs text-fg-muted">This will break all existing git remote URLs.</p>
          </div>
          <Button size="sm" variant="danger" onClick={() => setShowRename(true)}>
            Rename
          </Button>
        </div>
        {/* Delete */}
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-fg">Delete this repository</p>
            <p className="text-xs text-fg-muted">Once deleted, there is no going back. All data will be permanently lost.</p>
          </div>
          <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Rename modal */}
      <Modal open={showRename} onClose={() => setShowRename(false)} title="Rename repository" size="sm">
        <div className="space-y-4">
          <Input
            label="New name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={repository.name}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowRename(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={renaming}
              disabled={!newName.trim() || newName === repository.name}
              onClick={() =>
                renameRepo({
                  variables: { input: { owner, currentName: repository.name, newName } },
                })
              }
            >
              Rename
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete repository" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-fg-muted">
            This action <strong className="text-fg">cannot be undone</strong>. Type{' '}
            <strong className="text-fg font-mono">{owner}/{repository.name}</strong> to confirm.
          </p>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={`${owner}/${repository.name}`}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={confirmName !== `${owner}/${repository.name}`}
              onClick={() => deleteRepo({ variables: { owner, name: repository.name } })}
            >
              I understand, delete this repository
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
