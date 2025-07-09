"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Search,
	Download,
	Grid3X3,
	SortAsc,
	SortDesc,
	Settings2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
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
import { TableSkeleton } from "../TableSkeleton";

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

export const TablePreview = ({ content, status = "idle", showToolbar = true }: TablePreviewProps) => {
	const tArtifact = useTranslations("Artifact");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [searchInput, setSearchInput] = useState("");

	// 如果正在流式传输，显示骨架屏
	if (status === "streaming") {
		return <TableSkeleton />;
	}

	// Debounced search handler
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

	// Parse table data
	const tableData = useMemo((): TableData => {
		try {
			const lines = content.trim().split("\n");

			if (lines.length === 0) return { headers: [], rows: [] };
			
			// Helper function to filter out Markdown table separator lines
			const isMarkdownSeparator = (line: string): boolean => {
				const trimmedLine = line.trim();
				// 检查是否是 Markdown 分隔行：主要由 -, |，: 和空格组成
				return /^[\s\|:-]+$/.test(trimmedLine);
			};

			// Enhanced CSV parser with better separator detection
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

				// If no good separator found and there are spaces, try space
				if (maxColumns <= 1 && line.includes(" ")) {
					const spaceColumns = line.split(/\s+/);
					if (spaceColumns.length > maxColumns) {
						bestSeparator = " ";
					}
				}

				return bestSeparator;
			};

			const separator = detectSeparator(lines[0] || "");

			// Parse headers with better handling
			const parseRow = (line: string, sep: string): string[] => {
				if (sep === " ") {
					// Handle space-separated values
					return line
						.trim()
						.split(/\s+/)
						.filter((cell) => cell.length > 0);
				}
				// Handle other separators
				return line
					.split(sep)
					.map((cell) => cell.trim().replace(/^["']|["']$/g, ""));
			};

			const headers = parseRow(lines[0] || "", separator);

			// Parse data rows
			const rows = lines
				.slice(1)
				.filter((line) => !isMarkdownSeparator(line))
				.map((line) => parseRow(line, separator))
				.filter((row) => row.some((cell) => cell && cell.trim().length > 0)); // 只保留非空行

			// If we only got one column, try alternative parsing methods
			if (headers.length === 1 && lines.length > 1) {
				// Try to detect if this might be a different format
				const firstLine = lines[0];
				const secondLine = lines[1];

				// Check if it looks like space-separated data
				if (
					firstLine &&
					secondLine &&
					firstLine.includes(" ") &&
					secondLine.includes(" ")
				) {
					const spaceHeaders = firstLine.trim().split(/\s+/);
					const spaceRows = lines
						.slice(1)
						.filter((line) => !isMarkdownSeparator(line))
						.map((line) => line.trim().split(/\s+/));

					if (
						spaceHeaders.length > 1 &&
						spaceRows[0]?.length === spaceHeaders.length
					) {
						return { headers: spaceHeaders, rows: spaceRows };
					}
				}

				// Try comma with no spaces
				if (firstLine?.includes(",")) {
					const commaHeaders = firstLine.split(",");
					const commaRows = lines
						.slice(1)
						.filter((line) => !isMarkdownSeparator(line))
						.map((line) => line.split(","));

					if (commaHeaders.length > 1) {
						return { headers: commaHeaders, rows: commaRows };
					}
				}
			}

			return { headers, rows };
		} catch (error) {
			// If parsing fails, return empty table data
			console.warn("Table parsing failed:", error);
			return { headers: [], rows: [] };
		}
	}, [content, tArtifact]);

	// Convert to TanStack Table format
	const data = useMemo((): DynamicRow[] => {
		// 过滤掉空行
		const validRows = tableData.rows.filter(row => 
			row && row.length > 0 && row.some(cell => cell && cell.trim() !== "")
		);
		
		return validRows.map((row, index) => {
			const rowObject: DynamicRow = { _index: index };
			tableData.headers.forEach((header, colIndex) => {
				// Ensure we don't have undefined values and handle different data types
				const cellValue = row[colIndex];
				if (cellValue !== undefined && cellValue !== null && cellValue.trim() !== "") {
					// Try to detect if it's a number
					const numValue = Number(cellValue);
					rowObject[header] =
						!Number.isNaN(numValue) && cellValue.trim() !== ""
							? numValue
							: String(cellValue).trim();
				} else {
					rowObject[header] = "";
				}
			});
			return rowObject;
		});
	}, [tableData]);

	// Generate columns for TanStack Table
	const columns = useMemo<ColumnDef<DynamicRow>[]>(() => {
		// 过滤掉空的列头
		const validHeaders = tableData.headers.filter(header => 
			header && header.trim() !== ""
		);
		
		return validHeaders.map((header, index) => {
			// 使用 header 名称作为 id，如果有重复则添加索引
			const columnId = header || `column-${index}`;
			return {
				id: columnId,
				accessorKey: header,
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
							className="h-8 px-2 lg:px-3 hover:bg-muted/80 font-semibold text-left justify-start"
						>
							<span className="truncate">{header}</span>
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
							<span className="text-sm text-foreground/90 font-mono break-all">
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

	const exportCSV = () => {
		const csvContent = [
			tableData.headers.join(","),
			...table
				.getFilteredRowModel()
				.rows.map((row) =>
					tableData.headers
						.map((header) => `"${row.original[header] || ""}"`)
						.join(","),
				),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = "table_data.csv";
		link.click();
	};

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
							<details className="mt-4 text-left">
								<summary className="cursor-pointer text-xs">
									{tArtifact("debugInfo")}
								</summary>
								<pre className="mt-2 text-xs bg-muted p-2 rounded max-w-md overflow-auto">
									{content.substring(0, 200)}
									{content.length > 200 && "..."}
								</pre>
							</details>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Enhanced Toolbar */}
			{showToolbar && (
				<div className="flex items-center justify-between px-4 py-2 border-b bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm flex-shrink-0">
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1.5">
							<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
							<Grid3X3 className="w-4 h-4 text-primary" />
							<span className="text-xs font-semibold text-foreground">
								{tArtifact("tablePreview")}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Badge
								variant="secondary"
								className="text-xs font-medium px-1.5 py-0.5"
							>
								{table.getFilteredRowModel().rows.length} {tArtifact("rows")}
							</Badge>
							<Badge variant="outline" className="text-xs font-medium px-1.5 py-0.5">
								{tableData.headers.length} {tArtifact("columns")}
							</Badge>
						</div>
					</div>

				<div className="flex items-center gap-2">
					{/* Enhanced Global Search */}
					<div className="relative">
						<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
						<Input
							placeholder={tArtifact("searchAllColumns")}
							value={searchInput}
							onChange={(event) => handleSearchChange(event.target.value)}
							className="h-6 w-[200px] pl-7 pr-7 text-xs bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
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
							>
								<span className="sr-only">{tArtifact("clearSearch")}</span>×
							</Button>
						)}
					</div>

					{/* Enhanced Column visibility toggle */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-6 px-2 text-xs font-medium border-muted-foreground/20 hover:bg-muted/80"
							>
								<Settings2 className="w-3 h-3 mr-1" />
								{tArtifact("columns")}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[180px]">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Export button */}
					<Button
						variant="outline"
						size="sm"
						onClick={exportCSV}
						className="h-6 px-2 text-xs"
					>
						<Download className="w-3 h-3 mr-1" />
						{tArtifact("export")}
					</Button>
				</div>
			</div>
			)}

			{/* Table content */}
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
										className="h-24 text-center"
									>
										{tArtifact("noResults")}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10 flex-shrink-0">
				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					<span>
						{tableData.headers.length} {tArtifact("columns")}
					</span>
					<span>
						{data.length} {tArtifact("totalRows")}
					</span>
					<span>
						{table.getFilteredRowModel().rows.length} {tArtifact("visibleRows")}
					</span>
				</div>

				<div className="flex items-center space-x-2">
					<div className="flex items-center space-x-2">
						<p className="text-xs font-medium">{tArtifact("rowsPerPage")}</p>
						<select
							value={table.getState().pagination.pageSize}
							onChange={(e) => {
								table.setPageSize(Number(e.target.value));
							}}
							title={tArtifact("rowsPerPage")}
							className="h-8 w-[70px] rounded border bg-background px-2 text-xs"
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

					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">{tArtifact("goToFirstPage")}</span>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">{tArtifact("goToPreviousPage")}</span>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">{tArtifact("goToNextPage")}</span>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">{tArtifact("goToLastPage")}</span>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
