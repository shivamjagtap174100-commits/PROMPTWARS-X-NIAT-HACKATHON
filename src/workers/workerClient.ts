import { DEFAULT_ENABLED_CATEGORIES } from '../engine/detectors/detectAll';
import { runSanitizationPipeline } from '../engine/pipeline';
import type {
  EnabledCategoriesMap,
  FileKind,
  RedactionMode,
  SanitizationResult,
  WorkerRequestPayload,
  WorkerResponsePayload,
} from '../types/privacy';

let workerInstance: Worker | null = null;
let requestCounter = 0;

function getOrCreateWorker(): Worker | null {
  if (typeof Worker === 'undefined') {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./sanitization.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      return null;
    }
  }
  return workerInstance;
}

export function disposeSanitizationWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}

export async function sanitizeDocumentAsync(params: {
  inputText: string;
  fileKind: FileKind;
  mode: RedactionMode;
  excludedIds: string[];
  preserveCsvHeader: boolean;
  workerThresholdChars: number;
  enabledCategories?: EnabledCategoriesMap;
}): Promise<SanitizationResult> {
  const {
    inputText,
    fileKind,
    mode,
    excludedIds,
    preserveCsvHeader,
    workerThresholdChars,
    enabledCategories = DEFAULT_ENABLED_CATEGORIES,
  } = params;

  const shouldUseWorker =
    inputText.length >= workerThresholdChars && typeof Worker !== 'undefined';

  if (!shouldUseWorker) {
    return runSanitizationPipeline(
      inputText,
      fileKind,
      mode,
      excludedIds,
      preserveCsvHeader,
      false,
      enabledCategories
    );
  }

  const worker = getOrCreateWorker();
  if (!worker) {
    return runSanitizationPipeline(
      inputText,
      fileKind,
      mode,
      excludedIds,
      preserveCsvHeader,
      false,
      enabledCategories
    );
  }

  requestCounter += 1;
  const requestId = `pg-req-${requestCounter}`;

  return new Promise<SanitizationResult>((resolve) => {
    const handleMessage = (event: MessageEvent<WorkerResponsePayload>) => {
      if (event.data.requestId !== requestId) return;
      cleanup();
      if (event.data.result) {
        resolve(event.data.result);
      } else {
        resolve(
          runSanitizationPipeline(
            inputText,
            fileKind,
            mode,
            excludedIds,
            preserveCsvHeader,
            false,
            enabledCategories
          )
        );
      }
    };

    const handleError = () => {
      cleanup();
      resolve(
        runSanitizationPipeline(
          inputText,
          fileKind,
          mode,
          excludedIds,
          preserveCsvHeader,
          false,
          enabledCategories
        )
      );
    };

    const cleanup = () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    const payload: WorkerRequestPayload = {
      requestId,
      inputText,
      fileKind,
      mode,
      excludedIds,
      preserveCsvHeader,
      enabledCategories,
    };
    worker.postMessage(payload);
  });
}
