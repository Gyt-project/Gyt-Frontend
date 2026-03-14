'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, FileText, History } from 'lucide-react';
import { GET_FILE_BLOB, GET_REPOSITORY } from '@/graphql/queries';
import { FileBlob, Repository } from '@/types';
import { b64Decode } from '@/lib/utils';
import RepoLayout from '@/components/layout/RepoLayout';
import CodeViewer from '@/components/repo/CodeViewer';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

export default function BlobPage() {
  const { username, repo, path: pathArr } = useParams<{
    username: string;
    repo: string;
    path: string[];
  }>();

  // First path segment is the ref (branch), rest is the file path
  const ref = pathArr[0];
  const filePath = pathArr.slice(1).join('/');
  const parentPath = pathArr.slice(0, -1).join('/');

  const { data: repoData } = useQuery<{ getRepository: Repository }>(GET_REPOSITORY, {
    variables: { owner: username, name: repo },
  });

  const { data, loading } = useQuery<{ getFileBlob: FileBlob }>(GET_FILE_BLOB, {
    variables: { owner: username, name: repo, path: filePath, ref },
  });

  return (
    <RepoLayout owner={username} repo={repo} repository={repoData?.getRepository}>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/${username}/${repo}?ref=${ref}`} className="text-accent-fg hover:underline font-medium">
              {repo}
            </Link>
            {filePath.split('/').map((seg, i, arr) => {
              const partial = arr.slice(0, i + 1).join('/');
              return (
                <span key={partial} className="flex items-center gap-1">
                  <span className="text-fg-muted">/</span>
                  {i < arr.length - 1 ? (
                    <Link
                      href={`/${username}/${repo}?ref=${ref}&path=${encodeURIComponent(partial)}`}
                      className="text-accent-fg hover:underline"
                    >
                      {seg}
                    </Link>
                  ) : (
                    <span className="text-fg font-medium">{seg}</span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-fg-muted" />
              <span className="text-sm text-fg-muted font-mono">{filePath}</span>
            </div>
            <Link href={`/${username}/${repo}/commits?ref=${ref}&path=${encodeURIComponent(filePath)}`}>
              <Button size="sm" variant="ghost" icon={<History size={14} />}>
                History
              </Button>
            </Link>
          </div>

          {data?.getFileBlob && (
            <CodeViewer
              content={data.getFileBlob.isBinary ? data.getFileBlob.content : b64Decode(data.getFileBlob.content)}
              path={filePath}
              size={data.getFileBlob.size}
              isBinary={data.getFileBlob.isBinary}
            />
          )}
        </div>
      )}
    </RepoLayout>
  );
}
