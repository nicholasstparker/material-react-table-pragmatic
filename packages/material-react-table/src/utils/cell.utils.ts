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

export const navigateToNextCell = (
  e: React.KeyboardEvent<HTMLTableCellElement>,
) => {
  if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    const currentCell = e.currentTarget;
    const tableElement = currentCell.closest('table');
    if (!tableElement) return;

    const currentIndex = parseInt(
      currentCell.getAttribute('data-index') || '0',
    );
    let nextCell: HTMLElement | undefined = undefined;

    const findNextCell = (index: number, searchDirection: 'f' | 'b') => {
      const allCells = Array.from(tableElement.querySelectorAll('th, td'));
      const currentCellIndex = allCells.indexOf(currentCell);
      const searchArray =
        searchDirection === 'f'
          ? allCells.slice(currentCellIndex + 1)
          : allCells.slice(0, currentCellIndex).reverse();
      return searchArray.find((cell) =>
        cell.matches(`[data-index="${index}"]`),
      ) as HTMLElement | undefined;
    };

    switch (e.key) {
      case 'ArrowRight':
        nextCell = findNextCell(currentIndex + 1, 'f');
        break;
      case 'ArrowLeft':
        nextCell = findNextCell(currentIndex - 1, 'b');
        break;
      case 'ArrowUp':
        nextCell = findNextCell(currentIndex, 'b');
        break;
      case 'ArrowDown':
        nextCell = findNextCell(currentIndex, 'f');
        break;
    }

    if (nextCell) {
      nextCell.focus();
    }
  }
};
