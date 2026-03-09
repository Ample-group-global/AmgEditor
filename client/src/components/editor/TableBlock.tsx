import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Block } from "@/lib/editor-types";
import { Plus, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TableBlockProps {
  block: Block;
  updateBlockMetadata: (id: string, metadata: any) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string) => void;
  readOnly?: boolean;
}

type TableData = {
  rows: number;
  cols: number;
  cells: string[][];
  columnWidths?: number[];
  hasHeader?: boolean;
  alignments?: string[];
};

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;

export const TableBlock: React.FC<TableBlockProps> = ({
  block,
  updateBlockMetadata,
  onKeyDown,
  onFocus,
  readOnly = false,
}) => {
  // Memoize initial table data to prevent unnecessary recalculations
  const getInitialTableData = useCallback((): TableData => {
    const metadata = block.metadata?.tableData;

    if (
      metadata &&
      metadata.cells &&
      Array.isArray(metadata.cells) &&
      metadata.cells.length > 0 &&
      Array.isArray(metadata.cells[0]) &&
      metadata.cells[0].length > 0
    ) {
      // Validate and normalize existing data
      const rows = Math.max(1, metadata.rows || metadata.cells.length);
      const cols = Math.max(1, metadata.cols || metadata.cells[0].length);

      // Ensure all rows have the same number of columns
      const normalizedCells = metadata.cells.map((row: any) => {
        const normalizedRow = Array.isArray(row) ? [...row] : [];
        while (normalizedRow.length < cols) {
          normalizedRow.push("");
        }
        return normalizedRow.slice(0, cols);
      });

      // Ensure we have at least one row
      while (normalizedCells.length < rows) {
        normalizedCells.push(Array(cols).fill(""));
      }

      return {
        rows: normalizedCells.length,
        cols,
        cells: normalizedCells,
        columnWidths: metadata.columnWidths && Array.isArray(metadata.columnWidths) && metadata.columnWidths.length === cols
          ? metadata.columnWidths
          : Array(cols).fill(100 / cols),
        hasHeader: metadata.hasHeader ?? false,
      };
    }

    // Return default table structure
    return {
      rows: DEFAULT_ROWS,
      cols: DEFAULT_COLS,
      cells: Array(DEFAULT_ROWS).fill(null).map(() => Array(DEFAULT_COLS).fill("")),
      columnWidths: Array(DEFAULT_COLS).fill(100 / DEFAULT_COLS),
      hasHeader: false,
    };
  }, [block.metadata?.tableData]);

  const initialTableData = useMemo(() => getInitialTableData(), [getInitialTableData]);

  const [tableData, setTableData] = useState<TableData>(initialTableData);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    if (initialTableData.columnWidths && initialTableData.columnWidths.length === initialTableData.cols) {
      return initialTableData.columnWidths;
    }
    return Array(initialTableData.cols).fill(100 / initialTableData.cols);
  });

  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tableRef = useRef<HTMLTableElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number[]>([]);
  const isInitializedRef = useRef(false);
  const lastSyncedDataRef = useRef<string>("");

  // Initialize table data on mount and when block changes
  useEffect(() => {
    if (!isInitializedRef.current) {
      const initialData = getInitialTableData();
      setTableData(initialData);
      setColumnWidths(initialData.columnWidths || Array(initialData.cols).fill(100 / initialData.cols));

      // Only update metadata if it doesn't exist or is invalid
      if (!block.metadata?.tableData) {
        const dataStr = JSON.stringify(initialData);
        lastSyncedDataRef.current = dataStr;
        updateBlockMetadata(block.id, {
          ...(block.metadata || {}),
          tableData: initialData,
        });
      } else {
        // Store current metadata as last synced
        lastSyncedDataRef.current = JSON.stringify(block.metadata.tableData);
      }

      isInitializedRef.current = true;
      return;
    }

    // After initialization, only sync from metadata if it changed externally
    if (block.metadata?.tableData) {
      const metadata = block.metadata.tableData;
      const currentData = getInitialTableData();

      // Only update if metadata actually changed and is valid
      const metadataStr = JSON.stringify(metadata);
      const currentStr = JSON.stringify(currentData);

      if (metadataStr !== currentStr &&
        metadata.cells &&
        Array.isArray(metadata.cells) &&
        metadata.cells.length > 0) {
        setTableData(currentData);
        if (currentData.columnWidths && currentData.columnWidths.length === currentData.cols) {
          setColumnWidths(currentData.columnWidths);
        }
      }
    }
  }, [block.id, block.metadata?.tableData, getInitialTableData, updateBlockMetadata]);

  // Sync table data to metadata when it changes (debounced to prevent loops)
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const timeoutId = setTimeout(() => {
      const dataToSync: TableData = {
        ...tableData,
        columnWidths,
        hasHeader: tableData.hasHeader ?? false,
      };

      const dataStr = JSON.stringify(dataToSync);
      // Only sync if data actually changed
      if (dataStr !== lastSyncedDataRef.current) {
        lastSyncedDataRef.current = dataStr;
        updateBlockMetadata(block.id, {
          ...(block.metadata || {}),
          tableData: dataToSync,
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [tableData, columnWidths, block.id, block.metadata, updateBlockMetadata]);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    setTableData(prev => {
      const newCells = prev.cells.map((r, rIdx) =>
        rIdx === row ? r.map((c, cIdx) => (cIdx === col ? value : c)) : r
      );
      return { ...prev, cells: newCells };
    });
  }, []);

  const syncCellContent = useCallback((row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    const cellElement = cellRefs.current.get(cellKey);
    if (cellElement) {
      // Read innerText (plain text) as the canonical value when user edits
      const currentValue = cellElement.innerText;
      const storedValue = tableData.cells[row]?.[col] || "";
      // Compare against plain-text version of stored value
      const storedText = storedValue.replace(/<[^>]*>/g, "");
      if (currentValue !== storedText && currentValue !== storedValue) {
        updateCell(row, col, currentValue);
      }
    }
  }, [tableData.cells, updateCell]);

  // Sync cell content from state to DOM when no cell is active (with debouncing to prevent loops)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      tableData.cells.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          const cellKey = `${rowIdx}-${colIdx}`;
          const cellElement = cellRefs.current.get(cellKey);

          // Never overwrite a focused/active element
          if (cellElement && document.activeElement !== cellElement) {
            const expectedText = cell || "";
            const hasHtml = /<[a-z][\s\S]*>/i.test(expectedText);
            const currentContent = hasHtml ? cellElement.innerHTML : cellElement.innerText || "";
            if (currentContent !== expectedText) {
              if (hasHtml) {
                cellElement.innerHTML = expectedText;
              } else {
                cellElement.textContent = expectedText;
              }
            }
          }
        });
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [tableData.cells]);

  const addRow = useCallback((afterRow?: number) => {
    setTableData(prev => {
      const newRow = Array(prev.cols).fill("");
      const newCells = [...prev.cells];
      if (afterRow !== undefined && afterRow >= 0) {
        newCells.splice(afterRow + 1, 0, newRow);
      } else {
        newCells.push(newRow);
      }
      return { ...prev, rows: newCells.length, cells: newCells };
    });

    setTimeout(() => {
      const rowToFocus = afterRow !== undefined ? afterRow + 1 : tableData.rows;
      const cellKey = `${rowToFocus}-0`;
      const newCell = cellRefs.current.get(cellKey);
      if (newCell) {
        newCell.focus();
      }
    }, 50);
  }, [tableData.rows]);

  const removeRow = useCallback((rowIndex: number) => {
    if (tableData.rows <= 1) return;
    setTableData(prev => {
      const newCells = prev.cells.filter((_, idx) => idx !== rowIndex);
      return { ...prev, rows: newCells.length, cells: newCells };
    });
  }, [tableData.rows]);

  const addColumn = useCallback((afterCol?: number) => {
    setTableData(prev => {
      const newCells = prev.cells.map(row => {
        const newRow = [...row];
        if (afterCol !== undefined && afterCol >= 0) {
          newRow.splice(afterCol + 1, 0, "");
        } else {
          newRow.push("");
        }
        return newRow;
      });
      const newCols = newCells[0]?.length || prev.cols;

      setColumnWidths(prevWidths => {
        const newWidths = [...prevWidths];
        if (afterCol !== undefined && afterCol >= 0 && afterCol < newWidths.length) {
          const avgWidth = (newWidths[afterCol] + (newWidths[afterCol + 1] || newWidths[afterCol])) / 2;
          newWidths.splice(afterCol + 1, 0, avgWidth);
        } else {
          newWidths.push(100 / newCols);
        }
        const total = newWidths.reduce((sum, w) => sum + w, 0);
        return total > 0 ? newWidths.map(w => (w / total) * 100) : Array(newCols).fill(100 / newCols);
      });

      return { ...prev, cols: newCols, cells: newCells };
    });

    setTimeout(() => {
      const colToFocus = afterCol !== undefined ? afterCol + 1 : tableData.cols;
      const cellKey = `0-${colToFocus}`;
      const newCell = cellRefs.current.get(cellKey);
      if (newCell) {
        newCell.focus();
      }
    }, 50);
  }, [tableData.cols]);

  const removeColumn = useCallback((colIndex: number) => {
    if (tableData.cols <= 1) return;
    setTableData(prev => {
      const newCells = prev.cells.map(row => row.filter((_, idx) => idx !== colIndex));
      const newCols = newCells[0]?.length || prev.cols;

      setColumnWidths(prevWidths => {
        const newWidths = prevWidths.filter((_, idx) => idx !== colIndex);
        if (newWidths.length === 0) return [100];
        const total = newWidths.reduce((sum, w) => sum + w, 0);
        return total > 0 ? newWidths.map(w => (w / total) * 100) : Array(newCols).fill(100 / newCols);
      });

      return { ...prev, cols: newCols, cells: newCells };
    });

    setTimeout(() => {
      const colToFocus = Math.min(colIndex, tableData.cols - 2);
      if (colToFocus >= 0 && focusedCell) {
        const cellKey = `${focusedCell.row}-${colToFocus}`;
        const newCell = cellRefs.current.get(cellKey);
        if (newCell) {
          newCell.focus();
        }
      }
    }, 50);
  }, [tableData.cols, focusedCell]);


  const handleCellKeyDown = useCallback((
    e: React.KeyboardEvent,
    row: number,
    col: number
  ) => {
    if (readOnly) return;

    const cellKey = `${row}-${col}`;
    const cellElement = cellRefs.current.get(cellKey);

    if (e.key === "Tab") {
      e.preventDefault();
      const nextCol = e.shiftKey ? col - 1 : col + 1;
      if (nextCol >= 0 && nextCol < tableData.cols) {
        const nextCellKey = `${row}-${nextCol}`;
        const nextCell = cellRefs.current.get(nextCellKey);
        nextCell?.focus();
      } else if (!e.shiftKey && row < tableData.rows - 1) {
        const nextCellKey = `${row + 1}-0`;
        const nextCell = cellRefs.current.get(nextCellKey);
        nextCell?.focus();
      } else if (e.shiftKey && row > 0) {
        const nextCellKey = `${row - 1}-${tableData.cols - 1}`;
        const nextCell = cellRefs.current.get(nextCellKey);
        nextCell?.focus();
      } else if (!e.shiftKey) {
        addRow();
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (row < tableData.rows - 1) {
        const nextCellKey = `${row + 1}-${col}`;
        const nextCell = cellRefs.current.get(nextCellKey);
        nextCell?.focus();
      } else {
        addRow();
      }
    } else if (e.key === "ArrowDown" && e.ctrlKey) {
      e.preventDefault();
      addRow(row);
    } else if (e.key === "ArrowRight" && e.ctrlKey) {
      e.preventDefault();
      addColumn(col);
    } else if (e.key === "Backspace" && cellElement) {
      const text = cellElement.innerText;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.collapsed && range.startOffset === 0 && text === "") {
          e.preventDefault();
          if (col > 0) {
            const prevCellKey = `${row}-${col - 1}`;
            const prevCell = cellRefs.current.get(prevCellKey);
            prevCell?.focus();
          } else if (row > 0) {
            const prevCellKey = `${row - 1}-${tableData.cols - 1}`;
            const prevCell = cellRefs.current.get(prevCellKey);
            prevCell?.focus();
          }
        }
      }
    }
  }, [readOnly, tableData, addRow, addColumn]);

  const handleCellInput = useCallback((row: number, col: number, e: React.FormEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const htmlContent = element.innerHTML || "";
    const hasHtmlTags = /<(?:a|strong|em|b|i|u|s|del|code|mark|span|img|br)\b/i.test(htmlContent);
    const value = hasHtmlTags ? htmlContent : (element.innerText || "");
    // Only update state if value actually changed to avoid unnecessary re-renders
    const currentValue = tableDataRef.current.cells[row]?.[col] || "";
    if (value !== currentValue) {
      updateCell(row, col, value);
    }
  }, [updateCell]);

  const handleCellFocus = useCallback((row: number, col: number) => {
    setFocusedCell({ row, col });
    onFocus(block.id);
  }, [block.id, onFocus]);

  // Handle clicks on links inside table cells
  const handleCellClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a") as HTMLAnchorElement;
    if (link) {
      const href = link.getAttribute("href");
      if (href) {
        e.preventDefault();
        e.stopPropagation();
        window.open(href, "_blank", "noopener,noreferrer");
      }
    }
  }, []);

  // Use a ref to access current cells without causing ref callback recreation
  const tableDataRef = useRef(tableData);
  tableDataRef.current = tableData;

  // Track which cells have been initialized to avoid re-setting content
  const initializedCells = useRef<Set<string>>(new Set());

  const setCellRef = useCallback((row: number, col: number, element: HTMLDivElement | null) => {
    const key = `${row}-${col}`;
    if (element) {
      cellRefs.current.set(key, element);
      // Set initial content on first mount only, skip if element is focused
      if (!initializedCells.current.has(key) && document.activeElement !== element) {
        const cellContent = tableDataRef.current.cells[row]?.[col] || "";
        if (cellContent) {
          // Check if content already matches to avoid unnecessary DOM writes
          const currentText = element.textContent || "";
          const hasHtml = /<[a-z][\s\S]*>/i.test(cellContent);
          if (hasHtml) {
            if (element.innerHTML !== cellContent) {
              element.innerHTML = cellContent;
            }
          } else if (currentText !== cellContent) {
            element.textContent = cellContent;
          }
        }
        initializedCells.current.add(key);
      }
    } else {
      cellRefs.current.delete(key);
      // Don't clear initializedCells on ref cleanup - prevents cursor reset
      // when React re-renders and recreates inline ref callbacks
    }
  }, []); // Stable - no dependencies, uses ref for data

  const handleResizeStart = useCallback((colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colIndex);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = [...columnWidths];
  }, [columnWidths]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (resizingCol === null || !tableRef.current) return;

    const tableWidth = tableRef.current.offsetWidth;
    const deltaX = e.clientX - resizeStartX.current;
    const deltaPercent = (deltaX / tableWidth) * 100;

    setColumnWidths(prevWidths => {
      const newWidths = [...prevWidths];
      const currentWidth = resizeStartWidth.current[resizingCol];
      const nextCol = resizingCol + 1;

      const newCurrentWidth = Math.max(10, currentWidth + deltaPercent);

      if (nextCol < newWidths.length) {
        const nextWidth = resizeStartWidth.current[nextCol];
        const newNextWidth = Math.max(10, nextWidth - deltaPercent);
        newWidths[resizingCol] = newCurrentWidth;
        newWidths[nextCol] = newNextWidth;
      } else {
        newWidths[resizingCol] = newCurrentWidth;
      }

      const total = newWidths.reduce((sum, w) => sum + w, 0);
      return total > 0 ? newWidths.map(w => (w / total) * 100) : newWidths;
    });
  }, [resizingCol]);

  const handleResizeEnd = useCallback(() => {
    setResizingCol(null);
    resizeStartX.current = 0;
    resizeStartWidth.current = [];
  }, []);

  useEffect(() => {
    if (resizingCol !== null) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizingCol, handleResizeMove, handleResizeEnd]);

  // Validate table data before rendering
  if (!tableData || !tableData.cells || !Array.isArray(tableData.cells) ||
    tableData.cells.length === 0 || !tableData.cells[0] ||
    !Array.isArray(tableData.cells[0]) || tableData.cells[0].length === 0) {
    return (
      <div className="my-4 p-4 border-2 border-dashed border-border rounded-lg bg-muted/30 text-muted-foreground text-sm text-center">
        Initializing table...
      </div>
    );
  }

  const hasHeader = tableData.hasHeader ?? false;
  const displayRows = hasHeader ? tableData.cells.slice(1) : tableData.cells;

  return (
    <div
      className={cn(
        "my-6 relative group/table w-full",
        resizingCol !== null && "select-none"
      )}
      style={{ maxWidth: '100%' }}
      onMouseLeave={() => {
        // Don't clear hoveredRow/Col immediately to keep menus open
        setTimeout(() => {
          setHoveredRow(null);
          setHoveredCol(null);
        }, 200);
      }}
    >
      {/* Table Menu - Top Right (for header toggle and table options) */}
      {!readOnly && (
        <div className="absolute -top-10 right-0 opacity-0 group-hover/table:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTableData(prev => ({
                ...prev,
                hasHeader: !(prev.hasHeader ?? false),
              }))}>
                {hasHeader ? "Remove Header Row" : "Add Header Row"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => addColumn(tableData.cols - 1)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Column at End
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addRow(tableData.rows - 1)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Row at End
              </DropdownMenuItem>
              {tableData.cols > 1 && (
                <DropdownMenuItem onClick={() => removeColumn(tableData.cols - 1)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Last Column
                </DropdownMenuItem>
              )}
              {tableData.rows > 1 && (
                <DropdownMenuItem onClick={() => removeRow(tableData.rows - 1)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Last Row
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {/* Table Container */}
      <div className="w-full overflow-x-auto border-2 border-border rounded-md" style={{ maxWidth: '100%' }}>
        <table
          ref={tableRef}
          className="w-full border-collapse bg-background"
          style={{
            borderSpacing: 0,
            minWidth: '100%',
            tableLayout: 'fixed'
          }}
        >
          <colgroup>
            {Array(tableData.cols).fill(null).map((_, colIdx) => {
              const widthPercent = columnWidths[colIdx] || (100 / tableData.cols);
              return (
                <col
                  key={colIdx}
                  style={{ width: `${widthPercent}%`, minWidth: '100px' }}
                />
              );
            })}
          </colgroup>

          {/* Header Row */}
          {hasHeader && tableData.cells.length > 0 && (
            <thead>
              <tr className="bg-primary/10 border-b-2 border-primary/30 group/header-row">
                {tableData.cells[0].map((cell, colIdx) => (
                  <th
                    key={colIdx}
                    className="border border-primary/20 p-3 font-bold bg-primary/10 text-primary relative group/header-cell"
                    style={{ minHeight: '44px', textAlign: (tableData.alignments?.[colIdx] || 'left') as any }}
                  >
                    <div
                      ref={el => setCellRef(0, colIdx, el)}
                      contentEditable={!readOnly}
                      suppressContentEditableWarning
                      className="outline-none min-h-[1.5em] font-bold text-primary relative z-[1]"
                      data-placeholder="Header"
                      onInput={e => handleCellInput(0, colIdx, e)}
                      onKeyDown={e => handleCellKeyDown(e, 0, colIdx)}
                      onFocus={() => handleCellFocus(0, colIdx)}
                      onBlur={() => syncCellContent(0, colIdx)}
                      onClick={handleCellClick}
                    />

                    {/* Column Insert Control - Top */}
                    {!readOnly && (
                      <div
                        className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/header-row:opacity-100 group-hover/header-row:pointer-events-auto transition-opacity z-30 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          addColumn(colIdx);
                        }}
                        onMouseEnter={() => setHoveredCol(colIdx)}
                      >
                        <div className="h-1 w-8 bg-primary/60 hover:bg-primary rounded-full" />
                      </div>
                    )}

                    {/* Add Column Button at End of Header */}
                    {!readOnly && colIdx === tableData.cells[0].length - 1 && (
                      <div
                        className="absolute -top-1 -right-8 opacity-0 pointer-events-none group-hover/header-row:opacity-100 group-hover/header-row:pointer-events-auto transition-opacity z-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          addColumn(tableData.cols - 1);
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 rounded bg-background border shadow-sm hover:bg-primary/10"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Column Menu - Top Right */}
                    {!readOnly && hoveredCol === colIdx && (
                      <div className="absolute -top-8 right-0 opacity-100 transition-opacity z-30">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 rounded bg-background border shadow-sm"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => addColumn(colIdx)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Insert Column Left
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addColumn(colIdx + 1)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Insert Column Right
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addColumn(tableData.cols - 1)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Column at End
                            </DropdownMenuItem>
                            {tableData.cols > 1 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => removeColumn(colIdx)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Column
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Body Rows */}
          <tbody>
            {displayRows.map((row, rowIdx) => {
              const actualRowIdx = hasHeader ? rowIdx + 1 : rowIdx;
              return (
                <tr
                  key={actualRowIdx}
                  className="group/row hover:bg-muted/50 transition-colors"
                  onMouseEnter={() => setHoveredRow(actualRowIdx)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className="border border-border p-3 align-top relative group/cell"
                      style={{ minHeight: '44px', textAlign: (tableData.alignments?.[colIdx] || 'left') as any }}
                    >
                      <div
                        ref={el => setCellRef(actualRowIdx, colIdx, el)}
                        contentEditable={!readOnly}
                        suppressContentEditableWarning
                        className="outline-none min-h-[1.5em] w-full relative z-[1]"
                        data-placeholder=" "
                        onInput={e => handleCellInput(actualRowIdx, colIdx, e)}
                        onKeyDown={e => handleCellKeyDown(e, actualRowIdx, colIdx)}
                        onFocus={() => handleCellFocus(actualRowIdx, colIdx)}
                        onBlur={() => syncCellContent(actualRowIdx, colIdx)}
                        onClick={handleCellClick}
                      />

                      {/* Row Insert Control - Left (first column only) */}
                      {colIdx === 0 && !readOnly && (
                        <div
                          className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto transition-opacity z-30 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            addRow(actualRowIdx);
                          }}
                          onMouseEnter={() => setHoveredRow(actualRowIdx)}
                        >
                          <div className="h-8 w-1 bg-primary/60 hover:bg-primary rounded-full" />
                        </div>
                      )}

                      {/* Row Menu - Left (first column only, on hover) */}
                      {colIdx === 0 && !readOnly && hoveredRow === actualRowIdx && (
                        <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-100 transition-opacity z-30 pointer-events-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6 rounded bg-background border shadow-sm"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => addRow(actualRowIdx)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Insert Row Above
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addRow(actualRowIdx + 1)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Insert Row Below
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addRow(tableData.rows - 1)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Row at End
                              </DropdownMenuItem>
                              {tableData.rows > 1 && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => removeRow(actualRowIdx)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Row
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {/* Column Insert Control - Top (first row only, if no header) */}
                      {!hasHeader && actualRowIdx === 0 && !readOnly && (
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto transition-opacity z-30 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            addColumn(colIdx);
                          }}
                          onMouseEnter={() => setHoveredCol(colIdx)}
                        >
                          <div className="h-1 w-8 bg-primary/60 hover:bg-primary rounded-full" />
                        </div>
                      )}

                      {/* Column Menu - Top (first row only, if no header, on hover) */}
                      {!hasHeader && actualRowIdx === 0 && !readOnly && hoveredCol === colIdx && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-100 transition-opacity z-30">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6 rounded bg-background border shadow-sm"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => addColumn(colIdx)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Insert Column Left
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addColumn(colIdx + 1)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Insert Column Right
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addColumn(tableData.cols - 1)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Column at End
                              </DropdownMenuItem>
                              {tableData.cols > 1 && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => removeColumn(colIdx)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Column
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {/* Column resize handle */}
                      {!readOnly && colIdx < tableData.cols - 1 && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
                          style={{ marginRight: '-2px' }}
                          onMouseDown={e => handleResizeStart(colIdx, e)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
