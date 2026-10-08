import React from "react";

export type BadgeColor = "purple" | "green" | "cyan" | "yellow" | "orange" | "red" | "white";

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  status?: string;
  className?: string;
}

export default function Badge({
  children,
  color,
  status,
  className = "",
}: BadgeProps) {
  // Automatically determine color if "status" is provided
  let determinedColor: BadgeColor = "white";
  if (color) {
    determinedColor = color;
  } else if (status) {
    const s = status.toLowerCase();
    if (s === "watching" || s === "reading" || s === "playing") {
      determinedColor = "cyan";
    } else if (s === "completed") {
      determinedColor = "green";
    } else if (s === "plan to watch") {
      determinedColor = "yellow";
    } else if (s === "dropped") {
      determinedColor = "red";
    } else {
      determinedColor = "purple";
    }
  }

  const baseStyle =
    "font-mono text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 border border-white inline-flex items-center gap-1.5 select-none";

  const colorStyles = {
    purple: "bg-cyber-purple text-white border-white",
    green: "bg-cyber-green text-black border-white",
    cyan: "bg-cyber-cyan text-black border-white",
    yellow: "bg-cyber-yellow text-black border-white",
    orange: "bg-cyber-orange text-white border-white",
    red: "bg-cyber-red text-white border-white",
    white: "bg-white text-black border-black",
  };

  return (
    <span className={`${baseStyle} ${colorStyles[determinedColor]} ${className}`}>
      {children}
    </span>
  );
}
