import { ReactNode } from "react";

type ResponsiveTableProps = {
  children: ReactNode;
  minWidth?: number;
  className?: string;
};

export default function ResponsiveTable({
  children,
  minWidth = 640,
  className = "",
}: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-100 ${className}`}>
      <div className="w-full" style={{ minWidth: `${minWidth}px` }}>
        {children}
      </div>
    </div>
  );
}

/** Clases para usar en Table dentro de ResponsiveTable */
export const responsiveTableClass = "min-w-full w-full";
