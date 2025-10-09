import { render, screen, fireEvent } from '@testing-library/react';
import { AutocompleteInput } from '../autocomplete-input';

describe('AutocompleteInput', () => {
  const mockOnChange = jest.fn();
  const suggestions = ['Apple', 'Banana', 'Orange', 'Grape'];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders input field correctly', () => {
    render(
      <AutocompleteInput
        value=""
        onChange={mockOnChange}
        suggestions={suggestions}
        placeholder="Enter item name"
      />
    );

    expect(screen.getByPlaceholderText('Enter item name')).toBeInTheDocument();
  });

  it('shows filtered suggestions when typing', () => {
    render(
      <AutocompleteInput
        value="ap"
        onChange={mockOnChange}
        suggestions={suggestions}
        placeholder="Enter item name"
      />
    );

    // Focus the input to show suggestions
    const input = screen.getByPlaceholderText('Enter item name');
    fireEvent.focus(input);

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('calls onChange when suggestion is clicked', () => {
    render(
      <AutocompleteInput
        value="ap"
        onChange={mockOnChange}
        suggestions={suggestions}
        placeholder="Enter item name"
      />
    );

    const input = screen.getByPlaceholderText('Enter item name');
    fireEvent.focus(input);

    const appleSuggestion = screen.getByText('Apple');
    fireEvent.click(appleSuggestion);

    expect(mockOnChange).toHaveBeenCalledWith('Apple');
  });

  it('handles keyboard navigation', () => {
    render(
      <AutocompleteInput
        value="a"
        onChange={mockOnChange}
        suggestions={suggestions}
        placeholder="Enter item name"
      />
    );

    const input = screen.getByPlaceholderText('Enter item name');
    fireEvent.focus(input);

    // Press arrow down to select first suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith('Apple');
  });
});