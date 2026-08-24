import { serve } from 'wasi-sh/worker';

// Register the wasi-sh message handler synchronously. Vite can then bundle
// this project-owned worker entry for both development and production builds.
serve();
