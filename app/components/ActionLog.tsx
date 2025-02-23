"use client";

import { useGameStore } from "@/store/gameStore";

export default function ActionLog() {
  const { actionLog } = useGameStore();

  return (
    <div className="fixed flex flex-col justify-end top-0 right-0 bottom-20 opacity-50 align-middle text-left">
      {actionLog.map((action, index) => (
        <div key={index} className="p-2 text-white font-mono">
          {action}
        </div>
      ))}
    </div>
  );
}
