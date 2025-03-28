import { useState, useEffect } from "react";

export function useEllipsis(isProcessing: boolean) {
    const [dots, setDots] = useState("");

    useEffect(() => {
        if (!isProcessing) {
            setDots("");
            return;
        }

        const interval = setInterval(() => {
            setDots((prev) => {
                if (prev === "") return ".";
                if (prev === ".") return "..";
                if (prev === "..") return "...";
                return ".";
            });
        }, 400);

        return () => clearInterval(interval);
    }, [isProcessing]);

    return dots;
}