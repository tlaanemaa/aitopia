"use client";

import { useTheaterStore } from "../store/theaterStore";

export default function ActionLog() {
  const { directorLog, errors } = useTheaterStore();

  // Combine director log and errors into a single array
  const actionLog = [
    ...directorLog.map((item) => ({
      timestamp: item.timestamp,
      text: `${item.timestamp.toLocaleTimeString("en-US")}: ${item.content}`,
      isError: false,
    })),
    ...errors.map((error) => ({
      timestamp: error.timestamp,
      text: `${error.timestamp.toLocaleTimeString("en-US")}: ERROR - ${
        error.message
      }`,
      isError: true,
    })),
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="fixed flex flex-col justify-end top-0 left-0 bottom-0 text-sm pb-24 pl-4 opacity-25 align-middle text-left space-y-1">
      {actionLog.map((action, index) => (
        <div
          key={index}
          className={`font-mono ${
            action.isError ? "text-red-500" : "text-white"
          }`}
        >
          {action.text}
        </div>
      ))}
    </div>
  );
}
