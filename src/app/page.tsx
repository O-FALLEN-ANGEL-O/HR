
import Loading from './loading';

// This page is now a simple loading component.
// All redirect logic is handled by the middleware, which is the single source of truth.
// This prevents redirect loops and ensures a smooth login experience.
export default function Home() {
  return <Loading />;
}
