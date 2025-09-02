"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Download,
	Grid3X3,
	Search,
	Settings2,
	SortAsc,
	SortDesc,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

interface TablePreviewProps {
	content: string;
	status?: "idle" | "streaming" | "error" | "loading";
	showToolbar?: boolean;
}

interface TableData {
	headers: string[];
	rows: string[][];
}

// Dynamic row type for TanStack Table
type DynamicRow = Record<string, string | number> & { _index?: number };

export const TablePreview = ({
	content,
	status = "idle",
	showToolbar = true,
}: TablePreviewProps) => {
	const tArtifact = useTranslations("Artifact");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [searchInput, setSearchInput] = useState("");

	// Debounced search handler with improved performance
	const debouncedSetGlobalFilter = useCallback((value: string) => {
		const timeoutId = setTimeout(() => {
			setGlobalFilter(value);
		}, 300);
		return () => clearTimeout(timeoutId);
	}, []);

	const handleSearchChange = useCallback(
		(value: string) => {
			setSearchInput(value);
			debouncedSetGlobalFilter(value);
		},
		[debouncedSetGlobalFilter],
	);

	// Enhanced table data parsing with better error handling and format detection
	const tableData = useMemo((): TableData => {
		try {
			const lines = content.trim().split("\n");

			if (lines.length === 0) return { headers: [], rows: [] };

			// Helper function to filter out Markdown table separator lines
			const isMarkdownSeparator = (line: string): boolean => {
				const trimmedLine = line.trim();
				return /^[\s\|:-]+$/.test(trimmedLine);
			};

			// Enhanced separator detection with improved logic
			const detectSeparator = (line: string): string => {
				const separators = [",", "\t", "|", ";"];
				let bestSeparator = ",";
				let maxColumns = 0;

				for (const sep of separators) {
					const columns = line.split(sep);
					if (columns.length > maxColumns) {
						maxColumns = columns.length;
						bestSeparator = sep;
					}
				}

				// Handle space-separated values as fallback
				if (maxColumns <= 1 && line.includes(" ")) {
					const spaceColumns = line.split(/\s+/);
					if (spaceColumns.length > maxColumns) {
						bestSeparator = " ";
					}
				}

				return bestSeparator;
			};

			const separator = detectSeparator(lines[0] || "");

			// Improved row parsing with better edge case handling
			const parseRow = (line: string, sep: string): string[] => {
				if (sep === " ") {
					return line
						.trim()
						.split(/\s+/)
						.filter((cell) => cell.length > 0);
				}

				return line
					.split(sep)
					.map((cell) => cell.trim().replace(/^["']|["']$/g, ""))
					.filter((cell) => cell.length > 0);
			};

			const headers = parseRow(lines[0] || "", separator);

			// Parse data rows with improved filtering
			const rows = lines
				.slice(1)
				.filter((line) => !isMarkdownSeparator(line) && line.trim().length > 0)
				.map((line) => parseRow(line, separator))
				.filter(
					(row) =>
						row.length > 0 &&
						row.some((cell) => cell && cell.trim().length > 0),
				);

			// Fallback parsing for edge cases
			if (headers.length === 1 && lines.length > 1) {
				const firstLine = lines[0];
				const secondLine = lines[1];

				// Try space-separated format
				if (firstLine?.includes(" ") && secondLine?.includes(" ")) {
					const spaceHeaders = firstLine.trim().split(/\s+/);
					const spaceRows = lines
						.slice(1)
						.filter(
							(line) => !isMarkdownSeparator(line) && line.trim().length > 0,
						)
						.map((line) => line.trim().split(/\s+/));

					if (
						spaceHeaders.length > 1 &&
						spaceRows[0]?.length === spaceHeaders.length
					) {
						return { headers: spaceHeaders, rows: spaceRows };
					}
				}

				// Try comma-separated format
				if (firstLine?.includes(",")) {
					const commaHeaders = firstLine.split(",").map((h) => h.trim());
					const commaRows = lines
						.slice(1)
						.filter(
							(line) => !isMarkdownSeparator(line) && line.trim().length > 0,
						)
						.map((line) => line.split(",").map((cell) => cell.trim()));

					if (commaHeaders.length > 1) {
						return { headers: commaHeaders, rows: commaRows };
					}
				}
			}

			return { headers, rows };
		} catch (error) {
			console.warn("Table parsing failed:", error);
			return { headers: [], rows: [] };
		}
	}, [content]);

	// Convert to TanStack Table format with improved data type handling
	const data = useMemo((): DynamicRow[] => {
		const validRows = tableData.rows.filter(
			(row) =>
				row && row.length > 0 && row.some((cell) => cell && cell.trim() !== ""),
		);

		return validRows.map((row, index) => {
			const rowObject: DynamicRow = { _index: index };
			tableData.headers.forEach((header, colIndex) => {
				const cellValue = row[colIndex];
				if (
					cellValue !== undefined &&
					cellValue !== null &&
					cellValue.trim() !== ""
				) {
					// Smart number detection
					const trimmedValue = cellValue.trim();
					const numValue = Number(trimmedValue);
					rowObject[header] =
						!Number.isNaN(numValue) && trimmedValue !== ""
							? numValue
							: trimmedValue;
				} else {
					rowObject[header] = "";
				}
			});
			return rowObject;
		});
	}, [tableData]);

	// Generate columns for TanStack Table with improved accessibility
	const columns = useMemo<ColumnDef<DynamicRow>[]>(() => {
		const validHeaders = tableData.headers.filter(
			(header) => header && header.trim() !== "",
		);

		return validHeaders.map((header, index) => {
			const columnId = header || `column-${index}`;
			return {
				id: columnId,
				accessorKey: header,
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
							className="h-8 px-2 lg:px-3 hover:bg-muted/80 font-semibold text-left justify-start"
							aria-label={`Sort by ${header}`}
						>
							<span className="truncate" title={header}>
								{header}
							</span>
							{column.getIsSorted() === "desc" ? (
								<SortDesc className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
							) : column.getIsSorted() === "asc" ? (
								<SortAsc className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
							) : (
								<div className="ml-2 h-3.5 w-3.5" />
							)}
						</Button>
					);
				},
				cell: ({ getValue }) => {
					const value = getValue();
					const displayValue =
						value === null || value === undefined ? "" : String(value);
					return (
						<div className="px-2 py-1">
							<span
								className="text-sm text-foreground/90 font-mono break-all"
								title={displayValue || undefined}
							>
								{displayValue || (
									<span className="text-muted-foreground italic">—</span>
								)}
							</span>
						</div>
					);
				},
			};
		});
	}, [tableData.headers]);

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "includesString",
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			globalFilter,
		},
	});

	// Improved CSV export with better formatting
	const exportCSV = useCallback(() => {
		const csvContent = [
			tableData.headers.join(","),
			...table.getFilteredRowModel().rows.map((row) =>
				tableData.headers
					.map((header) => {
						const value = row.original[header] || "";
						// Escape quotes and wrap in quotes if contains comma or quotes
						return typeof value === "string" &&
							(value.includes(",") || value.includes('"'))
							? `"${value.replace(/"/g, '""')}"`
							: `"${value}"`;
					})
					.join(","),
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `table_data_${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	}, [tableData, table]);

	// Enhanced empty state with better UX
	if (tableData.headers.length === 0) {
		return (
			<div className="flex flex-col h-full bg-background">
				<div className="flex items-center justify-center h-full text-muted-foreground">
					<div className="text-center space-y-4">
						<Grid3X3 className="w-16 h-16 mx-auto opacity-30" />
						<div>
							<p className="text-sm font-medium">
								{tArtifact("noTableDataFound")}
							</p>
							<p className="text-xs text-muted-foreground">
								{tArtifact("contentDoesNotContainTableData")}
							</p>
							{content.length > 0 && (
								<details className="mt-4 text-left">
									<summary className="cursor-pointer text-xs hover:text-foreground">
										{tArtifact("debugInfo")}
									</summary>
									<pre className="mt-2 text-xs bg-muted p-2 rounded max-w-md overflow-auto max-h-32">
										{content.substring(0, 500)}
										{content.length > 500 && "..."}
									</pre>
								</details>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Enhanced toolbar with better responsive design */}
			{showToolbar && (
				<div className="flex items-center justify-between px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[40px]">
					{/* Left side: Table info */}
					<div className="flex items-center gap-3 flex-shrink-0 min-w-0">
						<div className="flex items-center gap-2 px-2.5 py-1 bg-muted/40 rounded-md border border-border/40 flex-shrink-0">
							<Grid3X3 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
							<span className="text-sm font-medium text-foreground truncate">
								{tArtifact("tablePreview")}
							</span>
						</div>

						<div className="flex items-center gap-2 flex-shrink-0">
							<Badge
								variant="secondary"
								className="text-xs font-medium px-2 py-0.5"
							>
								{table.getFilteredRowModel().rows.length} {tArtifact("rows")}
							</Badge>
							<Badge
								variant="outline"
								className="text-xs font-medium px-2 py-0.5"
							>
								{tableData.headers.length} {tArtifact("columns")}
							</Badge>
						</div>
					</div>

					{/* Right side: Actions */}
					<div className="flex items-center gap-2 flex-shrink-0">
						{/* Search input */}
						<div className="relative">
							<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
							<Input
								placeholder={tArtifact("searchAllColumns")}
								value={searchInput}
								onChange={(event) => handleSearchChange(event.target.value)}
								className="h-7 w-[180px] pl-7 pr-7 text-xs bg-background/50 border-border/60 focus:border-primary/50 focus:ring-primary/20"
								aria-label={tArtifact("searchAllColumns")}
							/>
							{searchInput && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSearchInput("");
										setGlobalFilter("");
									}}
									className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted text-xs"
									aria-label={tArtifact("clearSearch")}
								>
									×
								</Button>
							)}
						</div>

						{/* Column visibility */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-xs rounded-md"
									title={tArtifact("toggleColumns")}
									aria-label={tArtifact("toggleColumns")}
								>
									<Settings2 className="h-3.5 w-3.5 mr-1" />
									{tArtifact("columns")}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								{table
									.getAllColumns()
									.filter((column) => column.getCanHide())
									.map((column) => (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize text-xs"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											<span className="truncate" title={column.id}>
												{column.id}
											</span>
										</DropdownMenuCheckboxItem>
									))}
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Export button */}
						<Button
							variant="ghost"
							size="sm"
							onClick={exportCSV}
							className="h-7 px-2 text-xs rounded-md"
							title={tArtifact("exportCSV")}
							aria-label={tArtifact("exportCSV")}
						>
							<Download className="h-3.5 w-3.5 mr-1" />
							{tArtifact("export")}
						</Button>
					</div>
				</div>
			)}

			{/* Table content with improved scrolling */}
			<div className="flex-1 overflow-auto p-4">
				<div className="rounded-md border bg-card">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										className="hover:bg-muted/30"
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center text-muted-foreground"
									>
										{tArtifact("noResults")}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Enhanced pagination with better accessibility */}
			{data.length > 10 && (
				<div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10 flex-shrink-0">
					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<span>
							{tableData.headers.length} {tArtifact("columns")}
						</span>
						<span>
							{data.length} {tArtifact("totalRows")}
						</span>
						<span>
							{table.getFilteredRowModel().rows.length}{" "}
							{tArtifact("visibleRows")}
						</span>
					</div>

					<div className="flex items-center space-x-2">
						<div className="flex items-center space-x-2">
							<label htmlFor="rows-per-page" className="text-xs font-medium">
								{tArtifact("rowsPerPage")}
							</label>
							<select
								id="rows-per-page"
								value={table.getState().pagination.pageSize}
								onChange={(e) => {
									table.setPageSize(Number(e.target.value));
								}}
								title={tArtifact("rowsPerPage")}
								className="h-8 w-[70px] rounded border bg-background px-2 text-xs"
								aria-label={tArtifact("rowsPerPage")}
							>
								{[10, 20, 30, 40, 50].map((pageSize) => (
									<option key={pageSize} value={pageSize}>
										{pageSize}
									</option>
								))}
							</select>
						</div>

						<div className="flex w-[100px] items-center justify-center text-xs font-medium">
							{tArtifact("page")} {table.getState().pagination.pageIndex + 1}{" "}
							{tArtifact("of")} {table.getPageCount()}
						</div>

						<div className="flex items-center space-x-1">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
								aria-label={tArtifact("goToFirstPage")}
							>
								<ChevronsLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
								aria-label={tArtifact("goToPreviousPage")}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								className="h-8 w-8 p-0"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
								aria-label={tArtifact("goToNextPage")}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
								aria-label={tArtifact("goToLastPage")}
							>
								<ChevronsRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
