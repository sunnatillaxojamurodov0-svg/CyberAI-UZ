type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  blurAmount?: string;
};

export function ProgressiveBlur({
  className = "",
  backgroundColor,
  position = "top",
  height = "150px",
  blurAmount = "4px",
}: ProgressiveBlurProps) {
  const isTop = position === "top";
  const bg = backgroundColor || "var(--color-background)";

  return (
    <div
      className={`pointer-events-none absolute left-0 z-50 w-full select-none ${className}`}
      style={{
        [isTop ? "top" : "bottom"]: 0,
        height,
        background: isTop
          ? `linear-gradient(to top, transparent, ${bg})`
          : `linear-gradient(to bottom, transparent, ${bg})`,
        maskImage: isTop
          ? `linear-gradient(to bottom, ${bg} 50%, transparent)`
          : `linear-gradient(to top, ${bg} 50%, transparent)`,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        backdropFilter: `blur(${blurAmount})`,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    />
  );
}
