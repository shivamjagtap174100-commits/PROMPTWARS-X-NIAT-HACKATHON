import {
  Files,
  FileText,
  History,
  Lock,
  ScanSearch,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { AppRoute } from '../types/privacy';

export const PRIMARY_NAV_ITEMS: Array<{
  route: AppRoute;
  label: string;
  icon: LucideIcon;
}> = [
  { route: '/', label: 'Overview', icon: ShieldCheck },
  { route: '/workspace', label: 'Workspace', icon: ScanSearch },
  { route: '/documents', label: 'Documents', icon: Files },
  { route: '/audit-trail', label: 'Audit Trail', icon: History },
  { route: '/privacy-centre', label: 'Privacy Centre', icon: Lock },
  { route: '/documentation', label: 'Documentation', icon: FileText },
];
