import { runSanitizationPipeline } from '../engine/pipeline';
import type { WorkerRequestPayload, WorkerResponsePayload } from '../types/privacy';

self.onmessage = (event: MessageEvent<WorkerRequestPayload>) => {
  const {
    requestId,
    inputText,
    fileKind,
    mode,
    excludedIds,
    preserveCsvHeader,
    enabledCategories,
  } = event.data;

  try {
    const result = runSanitizationPipeline(
      inputText,
      fileKind,
      mode,
      excludedIds,
      preserveCsvHeader,
      true,
      enabledCategories
    );
    const response: WorkerResponsePayload = { requestId, result };
    self.postMessage(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Worker processing error';
    const response: WorkerResponsePayload = { requestId, error: message };
    self.postMessage(response);
  }
};
