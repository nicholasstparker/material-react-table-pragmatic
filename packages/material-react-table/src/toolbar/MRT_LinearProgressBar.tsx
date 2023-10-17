import Collapse from '@mui/material/Collapse';
import LinearProgress, {
  type LinearProgressProps,
} from '@mui/material/LinearProgress';
import { parseFromValuesOrFunc } from '../column.utils';
import { type MRT_RowData, type MRT_TableInstance } from '../types';

interface Props<TData extends MRT_RowData> extends LinearProgressProps {
  isTopToolbar: boolean;
  table: MRT_TableInstance<TData>;
}

export const MRT_LinearProgressBar = <TData extends MRT_RowData>({
  isTopToolbar,
  table,
  ...rest
}: Props<TData>) => {
  const {
    getState,
    options: { muiLinearProgressProps },
  } = table;
  const { showProgressBars } = getState();

  const linearProgressProps = {
    ...parseFromValuesOrFunc(muiLinearProgressProps, {
      isTopToolbar,
      table,
    }),
    ...rest,
  };

  return (
    <Collapse
      in={showProgressBars}
      mountOnEnter
      sx={{
        bottom: isTopToolbar ? 0 : undefined,
        position: 'absolute',
        top: !isTopToolbar ? 0 : undefined,
        width: '100%',
      }}
      unmountOnExit
    >
      <LinearProgress
        aria-busy="true"
        aria-label="Loading"
        sx={{ position: 'relative' }}
        {...linearProgressProps}
      />
    </Collapse>
  );
};
