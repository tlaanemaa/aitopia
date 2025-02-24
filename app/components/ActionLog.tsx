"use client";

import { useGameStore } from "@/store/gameStore";

export default function ActionLog() {
  const { actionLog } = useGameStore();

  return (
    <div className="fixed flex flex-col justify-end top-0 left-0 bottom-0 text-sm pb-20 pl-4 opacity-30 align-middle text-left space-y-1">
      {actionLog.map((action, index) => (
        <div key={index} className="text-white font-mono">
          {action}
        </div>
      ))}
    </div>
  );
}
