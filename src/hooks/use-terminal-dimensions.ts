import { useState, useLayoutEffect } from 'react';
import useStdout from './use-stdout.js';
import { DEFAULT_TERMINAL_WIDTH, DEFAULT_TERMINAL_HEIGHT } from '../constants.js';

/**
 * Hook that returns and tracks terminal dimensions.
 * The component will re-render when terminal dimensions change.
 */
const useTerminalDimensions = () => {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({
    columns: stdout.columns || DEFAULT_TERMINAL_WIDTH,
    rows: stdout.rows || DEFAULT_TERMINAL_HEIGHT
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      setDimensions({
        columns: stdout.columns || DEFAULT_TERMINAL_WIDTH,
        rows: stdout.rows || DEFAULT_TERMINAL_HEIGHT
      });
    };

    handleResize();

    stdout.on('resize', handleResize);

    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  return dimensions;
};

export default useTerminalDimensions;
