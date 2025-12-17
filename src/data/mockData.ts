import { Component } from '../types/component';

export const mockComponents: Component[] = [
  {
    id: '1',
    name: 'Button',
    description: 'A clickable button component with multiple variants',
    category: 'Inputs',
    tags: ['interactive', 'form', 'action'],
    lastUpdated: '2023-12-12T10:00:00Z',
    variants: [
      {
        id: '1-1',
        name: 'Primary',
        props: {
          variant: 'contained',
          color: 'primary',
          children: 'Click me'
        },
        lastUpdated: '2023-12-12T10:00:00Z'
      },
      {
        id: '1-2',
        name: 'Secondary',
        props: {
          variant: 'outlined',
          color: 'secondary',
          children: 'Click me'
        },
        lastUpdated: '2023-12-12T10:00:00Z'
      }
    ]
  },
  {
    id: '2',
    name: 'Card',
    description: 'A container for content with an optional header and actions',
    category: 'Surfaces',
    tags: ['container', 'content', 'layout'],
    lastUpdated: '2023-12-11T15:30:00Z',
    variants: [
      {
        id: '2-1',
        name: 'Basic',
        props: {
          elevation: 1
        },
        lastUpdated: '2023-12-11T15:30:00Z'
      }
    ]
  },
  {
    id: '3',
    name: 'Alert',
    description: 'Displays important alert messages',
    category: 'Feedback',
    tags: ['notification', 'message', 'status'],
    lastUpdated: '2023-12-10T09:15:00Z',
    variants: [
      {
        id: '3-1',
        name: 'Success',
        props: {
          severity: 'success',
          children: 'Operation completed successfully!'
        },
        lastUpdated: '2023-12-10T09:15:00Z'
      },
      {
        id: '3-2',
        name: 'Error',
        props: {
          severity: 'error',
          children: 'An error occurred!'
        },
        lastUpdated: '2023-12-10T09:15:00Z'
      }
    ]
  }
];
