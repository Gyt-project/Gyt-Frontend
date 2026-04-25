'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { Plus, Pencil, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { LIST_LABELS, GET_REPOSITORY } from '@/graphql/queries';
import { CREATE_LABEL, UPDATE_LABEL, DELETE_LABEL } from '@/graphql/mutations';
import { Label, ListLabelsResponse, Repository } from '@/types';
import RepoLayout from '@/components/layout/RepoLayout';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

// ─── Random colour palette ────────────────────────────────────────────────────
const PRESET_COLORS = [
  'd73a4a', 'e4e669', '0075ca', 'a2eeef', 'cfd3d7', '008672',
  'd876e3', '7057ff', 'e99695', 'fbca04', '0e8a16', 'b60205',
  'f9d0c4', 'c2e0c6', 'bfd4f2', 'd4c5f9',
];

function randomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

function contrastColor(hex: string) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#0d1117' : '#ffffff';
}

// ─── Label preview pill ───────────────────────────────────────────────────────
function LabelPreview({ name, color }: { name: string; color: string }) {
  const bg = color.startsWith('#') ? color : `#${color}`;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bg, color: contrastColor(color.replace('#', '')) }}
    >
      {name || 'Label preview'}
    </span>
  );
}

// ─── Colour picker row ────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: `#${c}`,
            borderColor: value === c ? '#ffffff' : 'transparent',
            outline: value === c ? '2px solid #58a6ff' : 'none',
            outlineOffset: '1px',
          }}
        />
      ))}
      <div className="flex items-center gap-1 ml-1">
        <button
          type="button"
          onClick={() => onChange(randomColor())}
          className="p-1 rounded text-fg-muted hover:text-fg border border-border"
          title="Random colour"
        >
          <RefreshCw size={12} />
        </button>
        <label className="flex items-center gap-1 text-xs text-fg-muted">
          <span>#</span>
          <input
            type="text"
            maxLength={6}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
            className="w-16 bg-canvas-overlay border border-border rounded px-1 py-0.5 text-xs text-fg font-mono focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
      </div>
    </div>
  );
}

// ─── Create label form ────────────────────────────────────────────────────────
function CreateLabelRow({
  owner, repo, onCreated,
}: {
  owner: string; repo: string; onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(randomColor());
  const [description, setDescription] = useState('');
  const [createLabel, { loading }] = useMutation(CREATE_LABEL, {
    onCompleted: () => { setName(''); setDescription(''); setColor(randomColor()); onCreated(); },
  });

  return (
    <div className="border border-border rounded-md p-4 bg-canvas-subtle space-y-3">
      <p className="text-sm font-semibold text-fg">Create a new label</p>
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="Label name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-canvas border border-border rounded px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-canvas border border-border rounded px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex flex-col items-end gap-2 sm:pt-1">
          <LabelPreview name={name} color={color} />
          <Button
            size="sm"
            variant="primary"
            loading={loading}
            disabled={!name.trim() || color.length !== 6}
            onClick={() =>
              createLabel({ variables: { input: { owner, repo, name: name.trim(), color, description: description || undefined } } })
            }
            icon={<Plus size={13} />}
          >
            Create label
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Editable label row ───────────────────────────────────────────────────────
function LabelRow({
  label, owner, repo, canEdit, onChanged,
}: {
  label: Label; owner: string; repo: string; canEdit: boolean; onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);
  const [description, setDescription] = useState(label.description);

  const [updateLabel, { loading: saving }] = useMutation(UPDATE_LABEL, {
    onCompleted: () => { setEditing(false); onChanged(); },
  });
  const [deleteLabel, { loading: deleting }] = useMutation(DELETE_LABEL, {
    onCompleted: () => onChanged(),
  });

  if (editing) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 items-start px-4 py-3 bg-canvas-subtle border-b border-border">
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-canvas border border-border rounded px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-canvas border border-border rounded px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex flex-col items-end gap-2 sm:pt-1">
          <LabelPreview name={name} color={color} />
          <div className="flex gap-1.5">
            <Button
              size="xs"
              variant="primary"
              loading={saving}
              disabled={!name.trim() || color.length !== 6}
              onClick={() =>
                updateLabel({
                  variables: {
                    input: {
                      owner, repo, name: label.name,
                      newName: name !== label.name ? name : undefined,
                      color: color !== label.color ? color : undefined,
                      description: description !== label.description ? description : undefined,
                    },
                  },
                })
              }
            >
              <Check size={11} className="mr-1" /> Save
            </Button>
            <Button size="xs" variant="ghost" onClick={() => { setEditing(false); setName(label.name); setColor(label.color); setDescription(label.description); }}>
              <X size={11} className="mr-1" /> Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-canvas-subtle transition-colors">
      <LabelPreview name={label.name} color={label.color} />
      <span className="flex-1 text-xs text-fg-muted">{label.description}</span>
      {canEdit && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-fg-muted hover:text-fg rounded transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete label "${label.name}"?`)) {
                deleteLabel({ variables: { owner, repo, name: label.name } });
              }
            }}
            disabled={deleting}
            className="p-1.5 text-fg-muted hover:text-danger-fg rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LabelsPage() {
  const { username, repo } = useParams<{ username: string; repo: string }>();
  const { user } = useAuth();
  const isOwner = user?.username === username;

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });

  const { data, loading, refetch } = useQuery<{ listLabels: ListLabelsResponse }>(LIST_LABELS, {
    variables: { owner: username, repo },
  });

  const labels = data?.listLabels.labels ?? [];

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">Labels</h2>
          <span className="text-sm text-fg-muted">{labels.length} label{labels.length !== 1 ? 's' : ''}</span>
        </div>

        {isOwner && (
          <CreateLabelRow owner={username} repo={repo} onCreated={refetch} />
        )}

        <div className="border border-border rounded-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : labels.length === 0 ? (
            <p className="text-center text-fg-muted py-10 text-sm">No labels yet.</p>
          ) : (
            <div>
              {labels.map((l) => (
                <LabelRow
                  key={l.id}
                  label={l}
                  owner={username}
                  repo={repo}
                  canEdit={isOwner}
                  onChanged={refetch}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </RepoLayout>
  );
}
