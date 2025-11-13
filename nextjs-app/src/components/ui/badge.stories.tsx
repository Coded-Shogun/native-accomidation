/**
 * Badge Component Stories
 * Status indicators and labels
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Suspended</Badge>
      <Badge variant="secondary">Inactive</Badge>
      <Badge variant="info">In Progress</Badge>
      <Badge variant="default">Completed</Badge>
    </div>
  ),
};

export const PropertyStatus: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">NSFAS Approved:</span>
        <Badge variant="success">Approved</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Property Status:</span>
        <Badge variant="info">Active</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Occupancy:</span>
        <Badge variant="warning">85%</Badge>
      </div>
    </div>
  ),
};
