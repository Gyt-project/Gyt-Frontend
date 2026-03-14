'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from '@apollo/client';
import { GET_REPOSITORY, LIST_LABELS } from '@/graphql/queries';
import { CREATE_ISSUE } from '@/graphql/mutations';
import { Repository, Label, ListLabelsResponse } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react';

export default function NewIssuePage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });
  const { data: labelsData } = useQuery<{ listLabels: ListLabelsResponse }>(LIST_LABELS, {
    variables: { owner: username, repo },
  });

  const [createIssue, { loading }] = useMutation(CREATE_ISSUE, {
    onCompleted: (data) => {
      router.push(`/${username}/${repo}/issues/${data.createIssue.number}`);
    },
  });

  const labels = labelsData?.listLabels.labels ?? [];

  const toggleLabel = (name: string) =>
    setSelectedLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createIssue({
      variables: {
        input: {
          owner: username,
          repo,
          title,
          body: body || undefined,
          assignees: assignee ? [assignee] : undefined,
          labels: selectedLabels.length ? selectedLabels : undefined,
        },
      },
    });
  };

  if (!user) return null;
  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-fg mb-6">New issue</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            required
          />
          <Textarea
            label="Description"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the issue…"
            rows={10}
          />

          {/* Labels */}
          {labels.length > 0 && (
            <div>
              <p className="text-sm text-fg-muted mb-2">Labels</p>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => {
                  const selected = selectedLabels.includes(l.name);
                  return (
                    <button
                      key={l.name}
                      type="button"
                      onClick={() => toggleLabel(l.name)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        selected ? 'ring-2 ring-accent' : ''
                      }`}
                      style={{ backgroundColor: `#${l.color}22`, borderColor: `#${l.color}`, color: `#${l.color}` }}
                    >
                      {l.name}
                      {selected && <X size={10} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignee */}
          <Input
            label="Assignee (optional)"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Username"
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading} disabled={!title.trim()}>
              Submit new issue
            </Button>
          </div>
        </form>
      </div>
    </RepoLayout>
  );
}
