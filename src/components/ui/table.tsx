import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-2xl shadow-lg bg-white">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-base text-black rounded-2xl overflow-hidden", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b border-black bg-[#a06ba5] rounded-t-2xl", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0 rounded-b-2xl", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-primary font-medium text-primary-foreground", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  // Uso aria-rowindex y aria-rowcount para saber si es la primera o última fila
  const rowIndex = props['aria-rowindex'] !== undefined ? Number(props['aria-rowindex']) : undefined;
  const rowCount = props['aria-rowcount'] !== undefined ? Number(props['aria-rowcount']) : undefined;
  const isSelected = className?.includes('data-[state=selected]') || className?.includes('bg-[#d6d6d6]');
  let rounded = '';
  if (isSelected && rowIndex === 0) {
    rounded = 'rounded-tl-2xl rounded-tr-2xl';
  } else if (isSelected && rowCount !== undefined && rowIndex === rowCount - 1) {
    rounded = 'rounded-bl-2xl rounded-br-2xl';
  }
  return (
    <tr
      ref={ref}
      className={cn(
        isSelected
          ? `bg-[#e5e7eb] ${rounded}`
          : "border-b-1 border-black transition-colors hover:bg-gray-100 even:bg-gray-30 odd:bg-white-white",
        className
      )}
      {...props}
    />
  );
});
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-14 px-4 text-left align-middle font-bold text-white border-b border-black bg-[#a06ba5] text-lg",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-3 align-middle text-black text-base",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-base border-b text-black", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} 