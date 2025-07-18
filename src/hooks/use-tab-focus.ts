
'use client';

import * as React from 'react';

type UseTabFocusProps = {
  onFocus?: () => void;
  onBlur?: () => void;
};

export function useTabFocus({ onFocus, onBlur }: UseTabFocusProps) {
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onBlur?.();
      } else {
        onFocus?.();
      }
    };

    const handleBlur = () => {
        onBlur?.();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onFocus, onBlur]);
}
