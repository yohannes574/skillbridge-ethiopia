import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../components/EmptyState';
import { BookOpen } from 'lucide-react';

describe('EmptyState Component', () => {
  it('renders title and description properly', () => {
    render(
      <EmptyState
        icon={BookOpen}
        title="No Courses Enrolled"
        description="You have not enrolled in any courses yet. Browse approved courses to get started."
      />
    );

    expect(screen.getByText('No Courses Enrolled')).toBeDefined();
    expect(screen.getByText(/You have not enrolled in any courses yet/i)).toBeDefined();
  });
});
