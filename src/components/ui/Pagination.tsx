import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, perPage, total, hasMore, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  const canPrev = page > 1;
  const canNext = hasMore !== undefined ? hasMore : page < totalPages;

  if (totalPages <= 1 && !hasMore) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-fg-muted">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeft size={14} />}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          icon={<ChevronRight size={14} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
