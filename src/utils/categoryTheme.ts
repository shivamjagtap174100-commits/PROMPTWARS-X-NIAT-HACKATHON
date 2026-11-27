import type {
  ClassificationGroup,
  EntityCategory,
  RedactionMode,
  RiskSeverity,
} from '../types/privacy';

export interface CategoryMeta {
  label: string;
  shortLabel: string;
  classification: ClassificationGroup;
  defaultReplaceLabel: string;
  defaultSeverity: RiskSeverity;
  dotColorClass: string;
  badgeClasses: string;
  originalHighlightClasses: string;
  replacementHighlightClasses: string;
}

export const CORE_CATEGORY_ORDER: EntityCategory[] = [
  'EMAIL',
  'PHONE',
  'IP',
  'PAN',
  'AADHAAR',
  'CREDIT_CARD',
];

export const EXTENDED_CATEGORY_ORDER: EntityCategory[] = [
  'PERSON_NAME',
  'DOB_AGE',
  'GOV_ID',
  'FINANCIAL_ID',
  'DIGITAL_SECRET',
  'LOCATION_ADDRESS',
  'CUSTOM',
];

export const CATEGORY_ORDER: EntityCategory[] = [
  ...CORE_CATEGORY_ORDER,
  ...EXTENDED_CATEGORY_ORDER,
];

export const CLASSIFICATION_ORDER: ClassificationGroup[] = [
  'Government Identification',
  'Financial Information',
  'Digital Credentials',
  'Personal Identity',
  'Contact Information',
  'Location Information',
  'Other Sensitive Data',
];

export const CATEGORY_META: Record<EntityCategory, CategoryMeta> = {
  EMAIL: {
    label: 'Email address',
    shortLabel: 'Email',
    classification: 'Contact Information',
    defaultReplaceLabel: '[EMAIL_ADDRESS]',
    defaultSeverity: 'MEDIUM',
    dotColorClass: 'bg-[#367A55] dark:bg-[#A3C1A5]',
    badgeClasses:
      'bg-[#DDE6DA] text-[#102D24] border-[#829782]/45 dark:bg-[#233128] dark:text-[#DDE6DA] dark:border-[#A3C1A5]/35',
    originalHighlightClasses:
      'bg-[#DDE6DA] text-[#102D24] border-b-2 border-[#173D30] dark:bg-[#24543E]/45 dark:text-[#F1F1E9] dark:border-[#A3C1A5]',
    replacementHighlightClasses:
      'bg-[#24543E] text-[#F1F1E9] border border-[#A3C1A5]/45',
  },
  PHONE: {
    label: 'Phone number',
    shortLabel: 'Phone',
    classification: 'Contact Information',
    defaultReplaceLabel: '[PHONE_NUMBER]',
    defaultSeverity: 'MEDIUM',
    dotColorClass: 'bg-[#B88735] dark:bg-[#D6B879]',
    badgeClasses:
      'bg-[#D6B879]/22 text-[#5B4115] border-[#B88735]/35 dark:bg-[#B88735]/20 dark:text-[#EED8A7] dark:border-[#D6B879]/35',
    originalHighlightClasses:
      'bg-[#D6B879]/28 text-[#46310D] border-b-2 border-[#B88735] dark:bg-[#B88735]/25 dark:text-[#F3DFB6] dark:border-[#D6B879]',
    replacementHighlightClasses:
      'bg-[#B88735]/28 text-[#F3DFB6] border border-[#D6B879]/45',
  },
  IP: {
    label: 'IP address',
    shortLabel: 'IP',
    classification: 'Digital Credentials',
    defaultReplaceLabel: '[IP_ADDRESS]',
    defaultSeverity: 'MEDIUM',
    dotColorClass: 'bg-[#24543E] dark:bg-[#829782]',
    badgeClasses:
      'bg-[#E5E8DF] text-[#173D30] border-[#829782]/45 dark:bg-[#232D26] dark:text-[#C5CCC5] dark:border-[#829782]/40',
    originalHighlightClasses:
      'bg-[#E5E8DF] text-[#102D24] border-b-2 border-[#24543E] dark:bg-[#344239] dark:text-[#F1F1E9] dark:border-[#829782]',
    replacementHighlightClasses:
      'bg-[#344239] text-[#DDE6DA] border border-[#829782]/45',
  },
  PAN: {
    label: 'Indian PAN',
    shortLabel: 'PAN',
    classification: 'Government Identification',
    defaultReplaceLabel: '[PAN_NUMBER]',
    defaultSeverity: 'HIGH',
    dotColorClass: 'bg-[#9E6A28] dark:bg-[#D6B879]',
    badgeClasses:
      'bg-[#D6B879]/25 text-[#4E3511] border-[#B88735]/40 dark:bg-[#9E6A28]/25 dark:text-[#EAD1A1] dark:border-[#D6B879]/40',
    originalHighlightClasses:
      'bg-[#D6B879]/30 text-[#3F2A0C] border-b-2 border-[#9E6A28] dark:bg-[#9E6A28]/30 dark:text-[#F2D9AA] dark:border-[#D6B879]',
    replacementHighlightClasses:
      'bg-[#7B551F]/55 text-[#F2D9AA] border border-[#D6B879]/45',
  },
  AADHAAR: {
    label: 'Aadhaar format',
    shortLabel: 'Aadhaar',
    classification: 'Government Identification',
    defaultReplaceLabel: '[AADHAAR_ID]',
    defaultSeverity: 'CRITICAL',
    dotColorClass: 'bg-[#B64B43] dark:bg-[#DF7B73]',
    badgeClasses:
      'bg-[#B64B43]/12 text-[#7A2721] border-[#B64B43]/30 dark:bg-[#B64B43]/22 dark:text-[#F1B7B2] dark:border-[#DF7B73]/35',
    originalHighlightClasses:
      'bg-[#B64B43]/15 text-[#661D18] border-b-2 border-[#B64B43] dark:bg-[#B64B43]/28 dark:text-[#F6C8C4] dark:border-[#DF7B73]',
    replacementHighlightClasses:
      'bg-[#8C3730]/60 text-[#F6C8C4] border border-[#DF7B73]/45',
  },
  CREDIT_CARD: {
    label: 'Credit card (Luhn)',
    shortLabel: 'Card',
    classification: 'Financial Information',
    defaultReplaceLabel: '[CREDIT_CARD]',
    defaultSeverity: 'CRITICAL',
    dotColorClass: 'bg-[#102D24] dark:bg-[#DDE6DA]',
    badgeClasses:
      'bg-[#E5E8DF] text-[#242923] border-[#747B72]/35 dark:bg-[#232D26] dark:text-[#F1F1E9] dark:border-[#A5AEA5]/35',
    originalHighlightClasses:
      'bg-[#DDE6DA]/85 text-[#102D24] border-b-2 border-[#102D24] dark:bg-[#233128] dark:text-[#F1F1E9] dark:border-[#A3C1A5]',
    replacementHighlightClasses:
      'bg-[#173D30] text-[#DDE6DA] border border-[#A3C1A5]/45',
  },
  PERSON_NAME: {
    label: 'Person name',
    shortLabel: 'Name',
    classification: 'Personal Identity',
    defaultReplaceLabel: '[PERSON_NAME]',
    defaultSeverity: 'MEDIUM',
    dotColorClass: 'bg-[#2E6B53] dark:bg-[#8DB89B]',
    badgeClasses:
      'bg-[#E2EBE4] text-[#143528] border-[#7FA38B]/45 dark:bg-[#1E2E26] dark:text-[#CEE2D3] dark:border-[#8DB89B]/35',
    originalHighlightClasses:
      'bg-[#E2EBE4] text-[#143528] border-b-2 border-[#2E6B53] dark:bg-[#223B2F] dark:text-[#F1F1E9] dark:border-[#8DB89B]',
    replacementHighlightClasses:
      'bg-[#214536] text-[#E2EBE4] border border-[#8DB89B]/45',
  },
  DOB_AGE: {
    label: 'DOB, age & gender',
    shortLabel: 'DOB/Bio',
    classification: 'Personal Identity',
    defaultReplaceLabel: '[PERSONAL_INFO]',
    defaultSeverity: 'HIGH',
    dotColorClass: 'bg-[#7A6A42] dark:bg-[#C9B785]',
    badgeClasses:
      'bg-[#ECE7D8] text-[#43391E] border-[#B2A27A]/40 dark:bg-[#2A261B] dark:text-[#E5DAB9] dark:border-[#C9B785]/35',
    originalHighlightClasses:
      'bg-[#ECE7D8] text-[#352C15] border-b-2 border-[#7A6A42] dark:bg-[#3A3321] dark:text-[#F3ECD6] dark:border-[#C9B785]',
    replacementHighlightClasses:
      'bg-[#564B2E] text-[#F3ECD6] border border-[#C9B785]/45',
  },
  GOV_ID: {
    label: 'Passport / Gov ID',
    shortLabel: 'Gov ID',
    classification: 'Government Identification',
    defaultReplaceLabel: '[GOV_ID]',
    defaultSeverity: 'CRITICAL',
    dotColorClass: 'bg-[#A1453E] dark:bg-[#E08A83]',
    badgeClasses:
      'bg-[#B64B43]/14 text-[#73231D] border-[#B64B43]/35 dark:bg-[#B64B43]/24 dark:text-[#F2BCB7] dark:border-[#E08A83]/35',
    originalHighlightClasses:
      'bg-[#B64B43]/18 text-[#631B16] border-b-2 border-[#A1453E] dark:bg-[#B64B43]/30 dark:text-[#F6C8C4] dark:border-[#E08A83]',
    replacementHighlightClasses:
      'bg-[#7D312B] text-[#F6C8C4] border border-[#E08A83]/45',
  },
  FINANCIAL_ID: {
    label: 'IFSC / UPI / Bank',
    shortLabel: 'Financial',
    classification: 'Financial Information',
    defaultReplaceLabel: '[FINANCIAL_ID]',
    defaultSeverity: 'HIGH',
    dotColorClass: 'bg-[#8B5D20] dark:bg-[#DFB572]',
    badgeClasses:
      'bg-[#D6B879]/24 text-[#4A3210] border-[#B88735]/40 dark:bg-[#8B5D20]/28 dark:text-[#F1D9A8] dark:border-[#DFB572]/35',
    originalHighlightClasses:
      'bg-[#D6B879]/32 text-[#3B260A] border-b-2 border-[#8B5D20] dark:bg-[#8B5D20]/35 dark:text-[#F5E3BC] dark:border-[#DFB572]',
    replacementHighlightClasses:
      'bg-[#6D4919] text-[#F5E3BC] border border-[#DFB572]/45',
  },
  DIGITAL_SECRET: {
    label: 'API key / password / URL',
    shortLabel: 'Secret/URL',
    classification: 'Digital Credentials',
    defaultReplaceLabel: '[DIGITAL_CREDENTIAL]',
    defaultSeverity: 'CRITICAL',
    dotColorClass: 'bg-[#B64B43] dark:bg-[#DF7B73]',
    badgeClasses:
      'bg-[#B64B43]/16 text-[#701F19] border-[#B64B43]/40 dark:bg-[#B64B43]/28 dark:text-[#F6C8C4] dark:border-[#DF7B73]/40',
    originalHighlightClasses:
      'bg-[#B64B43]/20 text-[#5E1914] border-b-2 border-[#B64B43] dark:bg-[#B64B43]/34 dark:text-[#FAD7D4] dark:border-[#DF7B73]',
    replacementHighlightClasses:
      'bg-[#7E2822] text-[#FAD7D4] border border-[#DF7B73]/50',
  },
  LOCATION_ADDRESS: {
    label: 'Address / PIN code',
    shortLabel: 'Address',
    classification: 'Location Information',
    defaultReplaceLabel: '[ADDRESS_LOCATION]',
    defaultSeverity: 'LOW',
    dotColorClass: 'bg-[#4C6B5D] dark:bg-[#95B5A6]',
    badgeClasses:
      'bg-[#E4EAE7] text-[#21362D] border-[#829782]/40 dark:bg-[#212D27] dark:text-[#CAD9D1] dark:border-[#95B5A6]/35',
    originalHighlightClasses:
      'bg-[#E4EAE7] text-[#1A2D24] border-b-2 border-[#4C6B5D] dark:bg-[#2A3B33] dark:text-[#E7F0EB] dark:border-[#95B5A6]',
    replacementHighlightClasses:
      'bg-[#334A3F] text-[#E7F0EB] border border-[#95B5A6]/45',
  },
  CUSTOM: {
    label: 'Custom regex rules',
    shortLabel: 'Custom',
    classification: 'Other Sensitive Data',
    defaultReplaceLabel: '[CUSTOM_PII]',
    defaultSeverity: 'HIGH',
    dotColorClass: 'bg-[#2C4F40] dark:bg-[#9DC0A8]',
    badgeClasses:
      'bg-[#E7ECE8] text-[#173D30] border-[#829782]/45 dark:bg-[#232F28] dark:text-[#DCE7DF] dark:border-[#9DC0A8]/35',
    originalHighlightClasses:
      'bg-[#E7ECE8] text-[#102D24] border-b-2 border-[#2C4F40] dark:bg-[#293A31] dark:text-[#F1F1E9] dark:border-[#9DC0A8]',
    replacementHighlightClasses:
      'bg-[#1D3E31] text-[#F1F1E9] border border-[#9DC0A8]/45',
  },
};

export const SEVERITY_META: Record<
  RiskSeverity,
  { label: string; weight: number; badgeClasses: string; barClasses: string }
> = {
  CRITICAL: {
    label: 'Critical',
    weight: 28,
    badgeClasses:
      'border-[#B64B43]/35 bg-[#B64B43]/12 text-[#7A2721] dark:border-[#DF7B73]/35 dark:bg-[#B64B43]/24 dark:text-[#F6C8C4]',
    barClasses: 'bg-[#B64B43] dark:bg-[#DF7B73]',
  },
  HIGH: {
    label: 'High',
    weight: 18,
    badgeClasses:
      'border-[#B88735]/35 bg-[#D6B879]/22 text-[#5B4115] dark:border-[#D6B879]/35 dark:bg-[#B88735]/24 dark:text-[#F2D9AA]',
    barClasses: 'bg-[#B88735] dark:bg-[#D6B879]',
  },
  MEDIUM: {
    label: 'Medium',
    weight: 10,
    badgeClasses:
      'border-[#367A55]/35 bg-[#DDE6DA]/70 text-[#102D24] dark:border-[#A3C1A5]/35 dark:bg-[#233128] dark:text-[#DDE6DA]',
    barClasses: 'bg-[#367A55] dark:bg-[#A3C1A5]',
  },
  LOW: {
    label: 'Low',
    weight: 5,
    badgeClasses:
      'border-[var(--pg-border)] bg-[var(--pg-surface-secondary)] text-[var(--pg-text-secondary)]',
    barClasses: 'bg-[#747B72] dark:bg-[#A5AEA5]',
  },
};

export const REDACTION_MODE_META: Record<
  RedactionMode,
  { code: string; title: string; shortTitle: string; subtitle: string; example: string }
> = {
  FULL_MASK: {
    code: 'Mode 01',
    title: 'Full Mask',
    shortTitle: 'Mask',
    subtitle: 'Replaces every matched sensitive value with [REDACTED]',
    example: 'shivam@example.com → [REDACTED]',
  },
  PARTIAL_MASK: {
    code: 'Mode 02',
    title: 'Partial Mask',
    shortTitle: 'Partial',
    subtitle: 'Conceals sensitive cores while leaving minimal context for verification',
    example: '4111111111111111 → XXXX-XXXX-XXXX-1111',
  },
  REPLACE: {
    code: 'Mode 03',
    title: 'Replace Label',
    shortTitle: 'Replace',
    subtitle: 'Substitutes typed entity tags ([EMAIL_ADDRESS], [PHONE_NUMBER], or custom)',
    example: '9876543210 → [PHONE_NUMBER]',
  },
  REMOVE: {
    code: 'Mode 04',
    title: 'Remove',
    shortTitle: 'Remove',
    subtitle: 'Deletes matched sensitive tokens directly while preserving document structure',
    example: 'Call 9876543210 now → Call now',
  },
  PSEUDONYM: {
    code: 'Mode 05',
    title: 'Consistent Pseudonymization',
    shortTitle: 'Pseudonymize',
    subtitle: 'Maps identical values to deterministic session placeholders per category',
    example: 'shivam@example.com → USER_01',
  },
};
