"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";

interface TimelineProps {
  roomId: string;
  timerId: string;
  duration: number; // in sec
  currentTime: number; // in sec
  markers: number[]; // in sec
  onTimeChange: (newTime: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  markers,
  onTimeChange,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

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

  const timeToPosition = (time: number) => width - (time / duration) * width;

  const positionToTime = (pos: number) => duration - (pos / width) * duration;

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    let newPos = e.clientX - rect.left;
    newPos = Math.max(0, Math.min(newPos, width));
    const newTime = positionToTime(newPos);
    onTimeChange(Math.round(newTime));
  };

  const handleMouseUp = () => {
    setDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    setDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // === Smart Marker Filtering Algorithm ===
  const visibleMarkers = useMemo(() => {
    if (width === 0 || duration === 0) return [];

    const minGapPx = 40; // minimum spacing between markers in px
    const maxMarkers = Math.floor(width / minGapPx);

    // Anchor times (important points to always try to include)
    const anchors = [
      0,
      duration / 4,
      duration / 2,
      (3 * duration) / 4,
      duration,
    ];

    const result = new Set<number>();

    // Always include closest to anchors
    anchors.forEach((anchor) => {
      let closest = markers[0];
      let minDist = Math.abs(markers[0] - anchor);
      for (const m of markers) {
        const dist = Math.abs(m - anchor);
        if (dist < minDist) {
          closest = m;
          minDist = dist;
        }
      }
      result.add(closest);
    });

    // Fill remaining markers (spread evenly)
    const spacing = duration / maxMarkers;
    for (let i = 0; i <= maxMarkers; i++) {
      const idealTime = spacing * i;
      let closest = markers[0];
      let minDist = Math.abs(markers[0] - idealTime);
      for (const m of markers) {
        const dist = Math.abs(m - idealTime);
        if (dist < minDist) {
          closest = m;
          minDist = dist;
        }
      }
      result.add(closest);
      if (result.size >= maxMarkers) break;
    }

    return Array.from(result).sort((a, b) => a - b);
  }, [markers, width, duration]);

  return (
    <div className="relative h-12 w-full" ref={trackRef}>
      {/* Background */}
      <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-300 rounded transform -translate-y-1/2" />

      {/* Markers */}
      {visibleMarkers.map((markerTime, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `${timeToPosition(markerTime)}px`, top: 0 }}
          onClick={() => onTimeChange(markerTime)}
        >
          <div className="w-[2px] h-8 bg-blue-500" />
          <span className="text-[10px] text-gray-600">
            {Math.round(markerTime)}s
          </span>
        </div>
      ))}

      {/* Current time draggable marker */}
      <div
        className="absolute top-0 h-full w-[4px] bg-red-600 cursor-pointer"
        style={{ left: `${timeToPosition(currentTime)}px` }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default Timeline;
