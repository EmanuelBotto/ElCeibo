import { ReactNode } from "react";

type ListScrollBoxProps = {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  scrollClassName?: string;
};

export default function ListScrollBox({
  children,
  footer,
  className = "",
  scrollClassName = "",
}: ListScrollBoxProps) {
  return (
    <div
      className={`flex flex-col min-h-0 flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}
    >
      <div
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-auto ${scrollClassName}`}
      >
        {children}
      </div>
      {footer ? (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-2">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
