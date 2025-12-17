import React from 'react';
import { Button, ButtonProps } from '@mui/material';

export interface TestButtonProps extends ButtonProps {
  label?: string;
}

export default function TestButton({ label = 'Click Me', ...props }: TestButtonProps) {
  return (
    <Button variant="contained" color="primary" {...props}>
      {label}
    </Button>
  );
}
