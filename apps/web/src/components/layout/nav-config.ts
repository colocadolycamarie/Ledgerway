import {
  BarChart3,
  BookOpen,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FilePlus2,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  Settings as SettingsIcon,
  ShoppingCart,
  SlidersHorizontal,
  WalletCards,
} from 'lucide-react';

export const primaryNavItems = [
  { label: 'Overview', href: '/app/ledgerway/', icon: LayoutDashboard },
  { label: 'Requisitions', href: '/app/ledgerway/requisitions', icon: FilePlus2 },
  { label: 'Approvals', href: '/app/ledgerway/approvals', icon: ClipboardCheck, count: true },
  { label: 'Purchase orders', href: '/app/ledgerway/purchase-orders', icon: ShoppingCart },
  { label: 'Vendors', href: '/app/ledgerway/vendors', icon: Building2 },
  { label: 'Receiving', href: '/app/ledgerway/receiving', icon: PackageCheck },
  { label: 'Invoices', href: '/app/ledgerway/invoices', icon: Receipt },
  { label: 'Payments', href: '/app/ledgerway/payments', icon: WalletCards },
  { label: 'Budgets', href: '/app/ledgerway/budgets', icon: CircleDollarSign },
  { label: 'Analytics', href: '/app/ledgerway/analytics', icon: BarChart3 },
];

export const controlPlaneNavItems = [
  { label: 'Approval policies', href: '/app/ledgerway/settings/approval-policies', icon: SlidersHorizontal },
  { label: 'Audit log', href: '/app/ledgerway/audit-log', icon: BookOpen },
  { label: 'Settings', href: '/app/ledgerway/settings', icon: SettingsIcon },
];
