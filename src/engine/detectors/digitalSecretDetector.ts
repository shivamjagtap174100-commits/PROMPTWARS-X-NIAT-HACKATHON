import type { DetectionMatch, SensitivityLevel } from '../../types/privacy';

const KNOWN_SECRET_REGEX =
  /(?<![A-Za-z0-9_-])((?:sk-(?:proj-|ant-[a-z0-9-]+-)?[A-Za-z0-9_-]{18,}|(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|(?:sk|pk)_(?:live|test)_[0-9A-Za-z]{16,}|eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}))(?![A-Za-z0-9_-])/g;

const BEARER_REGEX = /\bBearer\s+([A-Za-z0-9._~+/=-]{16,})\b/g;

const PASSWORD_ASSIGN_REGEX =
  /\b(?:password|passwd|pwd|client_secret|api_key|apikey|access_token|auth_token|secret_key|private_key|db_pass)\s*[:=]\s*(['"]?)([^\s,'";\n]{5,64})\1/gi;

const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

const SENSITIVE_QUERY_KEYS = [
  'token',
  'key',
  'api_key',
  'apikey',
  'secret',
  'auth',
  'password',
  'passwd',
  'sig',
  'signature',
  'session',
  'access_token',
];

export function detectDigitalSecrets(
  text: string,
  prefix = 'text',
  sensitivity: SensitivityLevel = 'BALANCED'
): DetectionMatch[] {
  const matches: DetectionMatch[] = [];

  KNOWN_SECRET_REGEX.lastIndex = 0;
  let tok: RegExpExecArray | null;
  while ((tok = KNOWN_SECRET_REGEX.exec(text)) !== null) {
    const value = tok[1];
    const start = tok.index;
    const end = start + value.length;
    const isJwt = value.startsWith('eyJ');
    matches.push({
      id: `${prefix}-DIGITAL_SECRET-${start}-${end}`,
      category: 'DIGITAL_SECRET',
      entityType: isJwt ? 'JWT Bearer Credential' : 'API Key / Cloud Token',
      classification: 'Digital Credentials',
      severity: 'CRITICAL',
      value,
      start,
      end,
      validationStatus: 'VALIDATED',
      detectionSource: 'API Token Signature Detector',
      detectionMethod: 'Structural Validator',
      confidence: 'High',
      confidenceScore: 98,
      confidenceReason: 'Matched high-confidence provider API key prefix or 3-part JWT structure',
      suggestedAction: 'FULL_MASK',
    });
  }

  BEARER_REGEX.lastIndex = 0;
  let bearer: RegExpExecArray | null;
  while ((bearer = BEARER_REGEX.exec(text)) !== null) {
    const value = bearer[1];
    const rel = bearer[0].indexOf(value);
    if (rel < 0 || !value) continue;
    const start = bearer.index + rel;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-DIGITAL_SECRET-${start}-${end}`,
      category: 'DIGITAL_SECRET',
      entityType: 'Bearer Token',
      classification: 'Digital Credentials',
      severity: 'CRITICAL',
      value,
      start,
      end,
      validationStatus: 'CONTEXT_MATCHED',
      detectionSource: 'Authorization Header Detector',
      detectionMethod: 'Context + Pattern',
      confidence: 'High',
      confidenceScore: 95,
      confidenceReason: 'Matched Bearer authorization token payload cleanly after Bearer scheme',
      suggestedAction: 'FULL_MASK',
    });
  }

  PASSWORD_ASSIGN_REGEX.lastIndex = 0;
  let pwd: RegExpExecArray | null;
  while ((pwd = PASSWORD_ASSIGN_REGEX.exec(text)) !== null) {
    const quote = pwd[1] || '';
    const value = pwd[2];
    if (!value) continue;
    const searchFrom = pwd[0].indexOf(quote ? `${quote}${value}` : value) + quote.length;
    if (searchFrom < quote.length) continue;
    const start = pwd.index + searchFrom;
    const end = start + value.length;
    matches.push({
      id: `${prefix}-DIGITAL_SECRET-${start}-${end}`,
      category: 'DIGITAL_SECRET',
      entityType: 'Password / Secret Assignment',
      classification: 'Digital Credentials',
      severity: 'CRITICAL',
      value,
      start,
      end,
      validationStatus: 'CONTEXT_MATCHED',
      detectionSource: 'Credential Assignment Detector',
      detectionMethod: 'Context + Pattern',
      confidence: 'Contextual',
      confidenceScore: 92,
      confidenceReason:
        'Detected secret value assigned directly to password / api_key / token key',
      suggestedAction: 'FULL_MASK',
    });
  }

  URL_REGEX.lastIndex = 0;
  let urlExec: RegExpExecArray | null;
  while ((urlExec = URL_REGEX.exec(text)) !== null) {
    const value = urlExec[0].replace(/[.,;)\]]+$/, '');
    if (!value) continue;
    const start = urlExec.index;
    const end = start + value.length;

    const lower = value.toLowerCase();
    const hasEmbeddedCreds = /https?:\/\/[^/\s]+:[^/\s]+@/i.test(value);
    const hasSensitiveParam = SENSITIVE_QUERY_KEYS.some(
      (key) => lower.includes(`?${key}=`) || lower.includes(`&${key}=`)
    );

    if (hasEmbeddedCreds || hasSensitiveParam) {
      matches.push({
        id: `${prefix}-DIGITAL_SECRET-${start}-${end}`,
        category: 'DIGITAL_SECRET',
        entityType: 'Sensitive URL / Query Token',
        classification: 'Digital Credentials',
        severity: 'CRITICAL',
        value,
        start,
        end,
        validationStatus: 'VALIDATED',
        detectionSource: 'URL Credential & Query Inspector',
        detectionMethod: 'Context + Pattern',
        confidence: 'High',
        confidenceScore: 94,
        confidenceReason: hasEmbeddedCreds
          ? 'URL embeds basic auth user:password credentials'
          : 'URL query string exposes token/key/auth/session parameter',
        suggestedAction: 'FULL_MASK',
      });
    } else if (sensitivity === 'STRICT') {
      matches.push({
        id: `${prefix}-DIGITAL_SECRET-${start}-${end}`,
        category: 'DIGITAL_SECRET',
        entityType: 'External URL',
        classification: 'Digital Credentials',
        severity: 'MEDIUM',
        value,
        start,
        end,
        validationStatus: 'FORMAT_VALIDATED',
        detectionSource: 'Strict URL Pattern Scanner',
        detectionMethod: 'Format Pattern Only',
        confidence: 'Format only',
        confidenceScore: 76,
        confidenceReason: 'Strict sensitivity flagged external HTTP/HTTPS link for redaction',
        suggestedAction: 'REPLACE',
      });
    }
  }

  return matches;
}
