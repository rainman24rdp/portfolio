import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock supabase before importing the component
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

import Photography from './Photography';
import { supabase } from '../lib/supabase';

describe('Photography Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(<Photography />);
    expect(screen.getByText('Loading photos...')).toBeInTheDocument();
  });

  it('shows empty state when no photos exist', async () => {
    render(<Photography />);

    await waitFor(() => {
      expect(screen.getByText(/No photos uploaded yet/)).toBeInTheDocument();
    });
  });

  it('renders photos when data is loaded', async () => {
    const mockPhotos = [
      { id: 1, url: 'https://example.com/photo1.jpg', title: 'Photo 1', category: 'Nature' },
      { id: 2, url: 'https://example.com/photo2.jpg', title: 'Photo 2', category: 'Urban' },
    ];

    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPhotos, error: null }))
      }))
    });

    render(<Photography />);

    await waitFor(() => {
      expect(screen.getByText('Photo 1')).toBeInTheDocument();
      expect(screen.getByText('Photo 2')).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Network error' } }))
      }))
    });

    render(<Photography />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading photos: Network error/)).toBeInTheDocument();
    });
  });

  it('displays page title and intro', async () => {
    render(<Photography />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Photography' })).toBeInTheDocument();
    });
  });
});

describe('LazyImage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders image with lazy loading attribute', async () => {
    const mockPhotos = [
      { id: 1, url: 'https://example.com/photo1.jpg', title: 'Test Photo', category: 'Test' },
    ];

    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPhotos, error: null }))
      }))
    });

    render(<Photography />);

    await waitFor(() => {
      const img = screen.getByAltText('Test Photo');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  it('shows placeholder before image loads', async () => {
    const mockPhotos = [
      { id: 1, url: 'https://example.com/photo1.jpg', title: 'Test Photo', category: 'Test' },
    ];

    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPhotos, error: null }))
      }))
    });

    render(<Photography />);

    await waitFor(() => {
      const img = screen.getByAltText('Test Photo');
      expect(img).toHaveClass('loading');
    });

    // Should have placeholder
    const container = document.querySelector('.lazy-image-container');
    expect(container).toBeInTheDocument();
    expect(container.querySelector('.image-placeholder')).toBeInTheDocument();
  });

  it('removes placeholder and adds loaded class after image loads', async () => {
    const mockPhotos = [
      { id: 1, url: 'https://example.com/photo1.jpg', title: 'Test Photo', category: 'Test' },
    ];

    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPhotos, error: null }))
      }))
    });

    render(<Photography />);

    await waitFor(() => {
      const img = screen.getByAltText('Test Photo');
      expect(img).toBeInTheDocument();
    });

    const img = screen.getByAltText('Test Photo');

    // Simulate image load
    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveClass('loaded');
      expect(img).not.toHaveClass('loading');
    });

    // Placeholder should be removed
    const container = document.querySelector('.lazy-image-container');
    expect(container.querySelector('.image-placeholder')).not.toBeInTheDocument();
  });

  it('renders correct alt text', async () => {
    const mockPhotos = [
      { id: 1, url: 'https://example.com/photo1.jpg', title: 'Beautiful Sunset', category: 'Nature' },
    ];

    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockPhotos, error: null }))
      }))
    });

    render(<Photography />);

    await waitFor(() => {
      const img = screen.getByAltText('Beautiful Sunset');
      expect(img).toBeInTheDocument();
    });
  });
});
