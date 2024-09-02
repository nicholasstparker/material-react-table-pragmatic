import {
  type MRT_Cell,
  type MRT_RowData,
  type MRT_TableInstance,
} from '../types';
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

export const cellNavigation = (
  e: React.KeyboardEvent<HTMLTableCellElement>,
) => {
  if (
    ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
      e.key,
    )
  ) {
    e.preventDefault();
    const currentCell = e.currentTarget;
    const currentRow = currentCell.closest('tr');

    const tableElement = currentCell.closest('table');
    const allCells = Array.from(tableElement?.querySelectorAll('th, td') || []);
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
            ? currentCell.closest('table')?.querySelector('tr')
            : currentCell.closest('table')?.lastElementChild?.lastElementChild;
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

    switch (e.key) {
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
        nextCell = findEdgeCell(e.ctrlKey ? 'f' : 'c', 'f');
        break;
      case 'End':
        nextCell = findEdgeCell(e.ctrlKey ? 'l' : 'c', 'l');
        break;
    }

    if (nextCell) {
      nextCell.focus();
    }
  }
};
