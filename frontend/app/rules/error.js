'use client';

import ErrorBoundaryUI from '../../components/ErrorBoundaryUI';

export default function Error({ error, reset }) {
  return <ErrorBoundaryUI error={error} reset={reset} />;
}
