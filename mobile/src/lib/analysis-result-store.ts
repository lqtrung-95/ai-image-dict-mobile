import type { AnalysisResult } from './analysis-service';

// Analysis results are too large for router params, so the capture screen
// stashes the latest result here and the result screen reads it back.
let latestResult: AnalysisResult | null = null;

export function setLatestAnalysisResult(result: AnalysisResult): void {
  latestResult = result;
}

export function getLatestAnalysisResult(): AnalysisResult | null {
  return latestResult;
}
