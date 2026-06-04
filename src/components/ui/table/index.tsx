import type { ReactNode } from "react";
import React from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
}

// Props for TableCell
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <table className={`w-full min-w-full border-collapse ${className ?? ""}`}>{children}</table>
  );
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={className}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className, ...rest }) => {
  return (
    <tr className={className} {...rest}>
      {children}
    </tr>
  );
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  ...rest
}) => {
  const CellTag = isHeader ? "th" : "td";
  const baseClass = isHeader
    ? "px-4 py-3 text-left align-middle text-theme-xs font-medium text-gray-500 dark:text-gray-400"
    : "px-4 py-3 text-left align-middle text-theme-sm text-gray-600 dark:text-gray-400";
  return (
    <CellTag className={`${baseClass} ${className ?? ""}`.trim()} {...rest}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
