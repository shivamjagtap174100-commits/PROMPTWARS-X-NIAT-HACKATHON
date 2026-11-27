import type { EntityCategory, RedactionMode } from '../types/privacy';

export interface CategoryMeta {
  label: string;
  shortLabel: string;
  dotColorClass: string;
  badgeClasses: string;
  originalHighlightClasses: string;
  replacementHighlightClasses: string;
}

export const CATEGORY_ORDER: EntityCategory[] = [
  'EMAIL',
  'PHONE',
  'IP',
  'PAN',
  'AADHAAR',
  'CREDIT_CARD',
];

export const CATEGORY_META: Record<EntityCategory, CategoryMeta> = {
  EMAIL: {
    label: 'Email address',
    shortLabel: 'Email',
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
    dotColorClass: 'bg-[#102D24] dark:bg-[#DDE6DA]',
    badgeClasses:
      'bg-[#E5E8DF] text-[#242923] border-[#747B72]/35 dark:bg-[#232D26] dark:text-[#F1F1E9] dark:border-[#A5AEA5]/35',
    originalHighlightClasses:
      'bg-[#DDE6DA]/85 text-[#102D24] border-b-2 border-[#102D24] dark:bg-[#233128] dark:text-[#F1F1E9] dark:border-[#A3C1A5]',
    replacementHighlightClasses:
      'bg-[#173D30] text-[#DDE6DA] border border-[#A3C1A5]/45',
  },
};

export const REDACTION_MODE_META: Record<
  RedactionMode,
  { code: string; title: string; subtitle: string; example: string }
> = {
  FULL_MASK: {
    code: 'Mode 01',
    title: 'Full Mask',
    subtitle: 'Replaces every matched sensitive value with a uniform redaction token',
    example: 'shivam@example.com → [REDACTED]',
  },
  PARTIAL_MASK: {
    code: 'Mode 02',
    title: 'Partial Mask',
    subtitle: 'Conceals sensitive cores while leaving minimal context for verification',
    example: '4111111111111111 → XXXX-XXXX-XXXX-1111',
  },
  PSEUDONYM: {
    code: 'Mode 03',
    title: 'Consistent Pseudonymization',
    subtitle: 'Maps identical values to deterministic session placeholders per category',
    example: 'shivam@example.com → USER_01',
  },
};
