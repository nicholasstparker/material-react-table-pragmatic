import {
  MRT_Header,
  type MRT_Cell,
  type MRT_RowData,
  type MRT_TableInstance,
} from '../types';
import {
  getMRT_RowSelectionHandler,
  getMRT_SelectAllHandler,
} from './row.utils';
import { parseFromValuesOrFunc } from './utils';

export const isCellEditable = <TData extends MRT_RowData>({
  cell,
  table,
}: {
  cell: MRT_Cell<TData>;
  table: MRT_TableInstance<TData>;
}) => {
  const { enableEditing } = table.options;
  const {
    column: { columnDef },
    row,
  } = cell;
  return (
    !cell.getIsPlaceholder() &&
    parseFromValuesOrFunc(enableEditing, row) &&
    parseFromValuesOrFunc(columnDef.enableEditing, row) !== false
  );
};

export const openEditingCell = <TData extends MRT_RowData>({
  cell,
  table,
}: {
  cell: MRT_Cell<TData>;
  table: MRT_TableInstance<TData>;
}) => {
  const {
    options: { editDisplayMode },
    refs: { editInputRefs },
  } = table;
  const { column } = cell;

  if (isCellEditable({ cell, table }) && editDisplayMode === 'cell') {
    table.setEditingCell(cell);
    queueMicrotask(() => {
      const textField = editInputRefs.current[column.id];
      if (textField) {
        textField.focus();
        textField.select?.();
      }
    });
  }
};

export const cellNavigation = <TData extends MRT_RowData = MRT_RowData>({
  cell,
  cellElements,
  cellValue,
  containerElement,
  event,
  header,
  parentElement,
  table,
}: {
  cell?: MRT_Cell<TData>;
  header?: MRT_Header<TData>;
  cellElements?: Array<HTMLTableCellElement>;
  cellValue?: string;
  containerElement?: HTMLTableElement;
  event: React.KeyboardEvent<HTMLTableCellElement>;
  parentElement?: HTMLTableRowElement;
  table: MRT_TableInstance<TData>;
}) => {
  if (cellValue && (event.ctrlKey || event.metaKey) && event.key === 'c') {
    navigator.clipboard.writeText(cellValue);
  } else if (['Enter', ' '].includes(event.key)) {
    if (cell?.column?.id === 'mrt-row-select') {
      getMRT_RowSelectionHandler({
        row: cell.row,
        table,
        //@ts-ignore
        staticRowIndex: +event.target.getAttribute('data-index'),
      })(event as any);
    } else if (
      header?.column?.id === 'mrt-row-select' &&
      table.options.enableSelectAll
    ) {
      getMRT_SelectAllHandler({
        table,
      })(event as any);
    } else if (
      cell?.column?.id === 'mrt-row-expand' &&
      (cell.row.getCanExpand() ||
        table.options.renderDetailPanel?.({ row: cell.row, table }))
    ) {
      cell.row.toggleExpanded();
    } else if (
      header?.column?.id === 'mrt-row-expand' &&
      table.options.enableExpandAll
    ) {
      table.toggleAllRowsExpanded();
    } else if (header?.column?.getCanSort()) {
      header.column.toggleSorting();
    } else if (cell?.column.id === 'mrt-row-pin') {
      cell.row.getIsPinned()
        ? cell.row.pin(false)
        : cell.row.pin(
            table.options.rowPinningDisplayMode?.includes('bottom')
              ? 'bottom'
              : 'top',
          );
    }
  } else if (
    ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
      event.key,
    )
  ) {
    event.preventDefault();
    const currentCell = event.currentTarget;
    const currentRow = parentElement || currentCell.closest('tr');

    const tableElement = containerElement || currentCell.closest('table');
    const allCells =
      cellElements ||
      Array.from(tableElement?.querySelectorAll('th, td') || []);
    const currentCellIndex = allCells.indexOf(currentCell);

    const currentIndex = parseInt(
      currentCell.getAttribute('data-index') || '0',
    );
    let nextCell: HTMLElement | undefined = undefined;

    //home/end first or last cell in row
    const findEdgeCell = (rowIndex: 'c' | 'f' | 'l', edge: 'f' | 'l') => {
      const row =
        rowIndex === 'c'
          ? currentRow
          : rowIndex === 'f'
            ? tableElement?.querySelector('tr')
            : tableElement?.lastElementChild?.lastElementChild;
      const rowCells = Array.from(row?.children || []);
      const targetCell =
        edge === 'f' ? rowCells[0] : rowCells[rowCells.length - 1];
      return targetCell as HTMLElement;
    };

    const findAdjacentCell = (
      columnIndex: number,
      searchDirection: 'f' | 'b',
    ) => {
      const searchArray =
        searchDirection === 'f'
          ? allCells.slice(currentCellIndex + 1)
          : allCells.slice(0, currentCellIndex).reverse();
      return searchArray.find((cell) =>
        cell.matches(`[data-index="${columnIndex}"]`),
      ) as HTMLElement | undefined;
    };

    switch (event.key) {
      case 'ArrowRight':
        nextCell = findAdjacentCell(currentIndex + 1, 'f');
        break;
      case 'ArrowLeft':
        nextCell = findAdjacentCell(currentIndex - 1, 'b');
        break;
      case 'ArrowUp':
        nextCell = findAdjacentCell(currentIndex, 'b');
        break;
      case 'ArrowDown':
        nextCell = findAdjacentCell(currentIndex, 'f');
        break;
      case 'Home':
        nextCell = findEdgeCell(event.ctrlKey ? 'f' : 'c', 'f');
        break;
      case 'End':
        nextCell = findEdgeCell(event.ctrlKey ? 'l' : 'c', 'l');
        break;
    }

    if (nextCell) {
      nextCell.focus();
    }
  }
};
