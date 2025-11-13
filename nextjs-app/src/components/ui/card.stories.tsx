/**
 * Card Component Stories
 * Demonstrates card layouts and variations
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content area.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Property Information</CardTitle>
        <CardDescription>View property details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Location:</span>
            <span className="text-sm font-medium">Cape Town</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Capacity:</span>
            <span className="text-sm font-medium">150 students</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Occupancy:</span>
            <span className="text-sm font-medium">85%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const StatisticsCard: Story = {
  render: () => (
    <Card className="w-[250px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1,234</div>
        <p className="text-xs text-muted-foreground">+20% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const InteractiveCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Submit Maintenance Request</CardTitle>
        <CardDescription>Report an issue with your accommodation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Issue Type</label>
          <select className="w-full rounded-md border p-2">
            <option>Plumbing</option>
            <option>Electrical</option>
            <option>Furniture</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea className="w-full rounded-md border p-2" rows={3} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Submit</Button>
      </CardFooter>
    </Card>
  ),
};
