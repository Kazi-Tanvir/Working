import React, { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "cyan" | "green" | "red" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  children,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyle =
    "font-mono uppercase font-bold text-sm tracking-wider px-4 py-2 border-2 text-center transition-all duration-100 ease-out select-none inline-flex items-center justify-center gap-2 focus:outline-none";

  const variants = {
    primary:
      "bg-cyber-purple border-white text-white shadow-[3px_3px_0px_0px_#ffffff] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#ffffff]",
    cyan:
      "bg-cyber-cyan border-black text-black shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#000000]",
    green:
      "bg-cyber-green border-black text-black shadow-[3px_3px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#000000]",
    red:
      "bg-cyber-red border-white text-white shadow-[3px_3px_0px_0px_#ffffff] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_#ffffff]",
    outline:
      "bg-transparent border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(255,255,255,0.2)]",
  };

  const widthStyle = fullWidth ? "w-full flex" : "";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
