"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { formatTime } from "@/utils/formatTime";

interface TimelineProps {
  roomId: string;
  timerId: string;
  duration: number; // in sec
  currentTime: number; // in sec
  onTimeChange: (newTime: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  onTimeChange,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hoverState, setHoverState] = useState(formatTime(currentTime));

  useEffect(() => {
    const updateWidth = () => {
      if (trackRef.current) {
        setWidth(trackRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    document.body.style.userSelect = dragging ? "none" : "auto";
    return () => {
      document.body.style.userSelect = "auto";
    };
  }, [dragging]);

  const timeToPosition = (time: number) => (time / duration) * width;

  const positionToTime = (pos: number) => (pos / width) * duration;

  const handleMouseHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let newPos = e.clientX - rect.left;
    newPos = Math.max(0, Math.min(newPos, rect.width));
    const newTime = duration - positionToTime(newPos); // Right to left
    setHoverState(formatTime(Math.round(newTime)));
  };

  const handleMouseDown = () => {
    setDragging(true);

    const handleMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      let newPos = e.clientX - rect.left;
      newPos = Math.max(0, Math.min(newPos, rect.width));

      const newTime = duration - positionToTime(newPos); // Right to left
      onTimeChange(Math.round(newTime));
    };

    const handleUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const visibleMarkers = useMemo(() => {
    if (duration <= 0) return [];
    const minGapPx = 80;
    const maxMarkers = Math.max(1, Math.floor(width / minGapPx));
    const step = duration / maxMarkers;
    const result: number[] = [];

    for (let i = 0; i <= maxMarkers; i++) {
      result.push(Math.round(i * step));
    }

    return result;
  }, [duration, width]);

  return (
    <div
      className="relative h-16 w-full"
      ref={trackRef}
      onMouseMove={handleMouseHover}
      onMouseLeave={() => setHoverState(formatTime(currentTime))}
    >
      <div>
        <span className="text-sm text-gray-600">
          Hover Timer Show : {hoverState}
        </span>
      </div>
      {/* Background track */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded transform -translate-y-1/2" />

      {/* Markers (Right to Left) */}
      {visibleMarkers.map((markerTime, i) => {
        const rightPos = timeToPosition(markerTime);
        return (
          <div
            key={i}
            className="absolute flex flex-col items-center"
            style={{ right: `${rightPos - 16}px` }}
            onClick={() => onTimeChange(markerTime)}
          >
            <div className="w-px h-4 bg-gray-300" />
            <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
              {formatTime(markerTime)}
            </span>
          </div>
        );
      })}

      {/* Current time draggable marker */}
      <div
        className="absolute top-0 h-full w-1 bg-red-500 cursor-pointer -mr-0.5"
        style={{ right: `${timeToPosition(currentTime)}px` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
      </div>
    </div>
  );
};

export default Timeline;
