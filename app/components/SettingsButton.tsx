'use client';

import { Settings2 } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

export default function SettingsButton() {
  const toggleSettings = useSettingsStore(state => state.toggleSettings);

  return (
    <button
      onClick={toggleSettings}
      className="fixed top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
      aria-label="Toggle Settings"
    >
      <Settings2 className="w-5 h-5 text-gray-700" />
    </button>
  );
} 