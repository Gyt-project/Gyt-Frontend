import { ApolloError } from '@apollo/client';

/**
 * Extract a clean, user-friendly message from an Apollo/gRPC error.
 *
 * gRPC errors come through Apollo as: "rpc error: code = NotFound desc = repository not found"
 * We strip the preamble and return just the human-readable part.
 */
export function formatError(err: ApolloError | Error | string | unknown): string {
  let raw: string;

  if (typeof err === 'string') {
    raw = err;
  } else if (err instanceof ApolloError) {
    // Prefer the first GraphQL error's message if available
    raw = err.graphQLErrors?.[0]?.message ?? err.message;
  } else if (err instanceof Error) {
    raw = err.message;
  } else {
    return 'An unexpected error occurred.';
  }

  // Strip gRPC error prefix: "rpc error: code = Xxx desc = "
  raw = raw.replace(/^rpc error: code = \w+ desc = /i, '');

  // Strip Apollo network prefix if present
  raw = raw.replace(/^(Response not successful|Network error):\s*/i, '');

  // Capitalize first letter
  raw = raw.charAt(0).toUpperCase() + raw.slice(1);

  return raw || 'An unexpected error occurred.';
}
