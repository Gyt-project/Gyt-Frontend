'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { LIST_TAGS, GET_REPOSITORY } from '@/graphql/queries';
import { CREATE_TAG, DELETE_TAG } from '@/graphql/mutations';
import { Repository, ListTagsResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import EmptyState from '@/components/ui/EmptyState';
import { shortSha } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function TagsPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const { user } = useAuth();
  const isOwner = user?.username === username;

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [sha, setSha] = useState('');
  const [message, setMessage] = useState('');

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data, loading, refetch } = useQuery<{ listTags: ListTagsResponse }>(LIST_TAGS, {
    variables: { owner: username, name: repo },
  });

  const [createTag, { loading: creating }] = useMutation(CREATE_TAG, {
    onCompleted: () => {
      refetch();
      setShowCreate(false);
      setName(''); setSha(''); setMessage('');
    },
  });
  const [deleteTag] = useMutation(DELETE_TAG, { onCompleted: () => refetch() });

  const tags = data?.listTags.tags ?? [];

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
            <Tag size={18} />
            Tags
          </h2>
          {isOwner && (
            <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowCreate(true)}>
              Create tag
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : tags.length === 0 ? (
          <EmptyState title="No tags yet" description="Tags mark specific points in history." />
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {tags.map((t) => (
              <div key={t.name} className="flex items-center justify-between px-4 py-3 hover:bg-canvas-subtle/40">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-fg-muted" />
                  <span className="font-medium text-fg">{t.name}</span>
                  {t.commitSha && (
                    <Link
                      href={`/${username}/${repo}/commit/${t.commitSha}`}
                      className="text-xs font-mono text-fg-muted hover:text-accent-fg"
                    >
                      {shortSha(t.commitSha)}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${username}/${repo}?ref=${t.name}`}
                    className="text-xs text-accent-fg hover:underline"
                  >
                    Browse
                  </Link>
                  {isOwner && (
                    <button
                      onClick={() =>
                        deleteTag({ variables: { owner: username, name: repo, tagName: t.name } })
                      }
                      className="text-fg-muted hover:text-danger-fg p-1 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create tag" size="sm">
        <div className="space-y-4">
          <Input
            label="Tag name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="v1.0.0"
          />
          <Input
            label="Target commit SHA"
            value={sha}
            onChange={(e) => setSha(e.target.value)}
            placeholder="abc1234…"
          />
          <Textarea
            label="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Annotated tag message…"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={creating}
              onClick={() =>
                createTag({
                  variables: { owner: username, name: repo, tagName: name, sha, message: message || undefined },
                })
              }
              disabled={!name || !sha}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </RepoLayout>
  );
}
