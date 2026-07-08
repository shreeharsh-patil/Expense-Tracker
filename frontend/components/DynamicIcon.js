'use client';

import { LayoutDashboard, Repeat, ScanLine, TrendingUp, Moon, Download } from 'lucide-react';

const iconMap = {
  LayoutDashboard, Repeat, ScanLine, TrendingUp, Moon, Download
};

export default function DynamicIcon({ name, className }) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
