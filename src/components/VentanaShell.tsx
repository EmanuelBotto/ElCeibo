import { ReactNode } from "react";

export type VentanaSizeToken = "4xl" | "6xl" | "7xl" | "full";

type VentanaShellProps = {
  title?: string;
  toolbar?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: VentanaSizeToken;
  maxHeight?: VentanaSizeToken;
  className?: string;
};

const maxWidthClass: Record<VentanaSizeToken, string> = {
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export const ventanaMaxHeightClass: Record<VentanaSizeToken, string> = {
  "4xl": "max-h-[calc(100dvh-7rem)]",
  "6xl": "max-h-[calc(100dvh-5rem)]",
  "7xl": "max-h-[calc(100dvh-3.5rem)]",
  full: "max-h-[calc(100dvh-2rem)]",
};

export default function VentanaShell({
  title,
  toolbar,
  actions,
  children,
  maxWidth = "6xl",
  maxHeight = "6xl",
  className = "",
}: VentanaShellProps) {
  const showHeader = Boolean(title) || Boolean(toolbar) || Boolean(actions);
  const onlyActions = !title && !toolbar && Boolean(actions);

  return (
    <div className={`w-full px-3 sm:px-4 py-4 sm:py-6 ${className}`}>
      <div
        className={`mx-auto w-full ${maxWidthClass[maxWidth]} rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 lg:p-8 shadow-2xl flex flex-col min-h-0 ${ventanaMaxHeightClass[maxHeight]} gap-4 sm:gap-6`}
      >
        {showHeader ? (
          <div
            className={`flex flex-shrink-0 gap-3 sm:gap-4 ${
              title
                ? "flex-col md:flex-row md:justify-between md:items-center"
                : onlyActions
                  ? "flex-row justify-end"
                  : "flex-col sm:flex-row sm:items-center"
            }`}
          >
            {title ? (
              <div className="text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 tracking-tight">
                  {title}
                </h1>
              </div>
            ) : null}
            {toolbar ? (
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {toolbar}
              </div>
            ) : null}
            {actions ? (
              <div
                className={`flex flex-wrap gap-2 ${
                  onlyActions ? "justify-end" : "justify-center sm:justify-end"
                }`}
              >
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col flex-1 min-h-0 gap-4">{children}</div>
      </div>
    </div>
  );
}
