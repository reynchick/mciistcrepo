import React, { useMemo } from 'react';
import Select, { MultiValue, StylesConfig, GroupBase, FormatOptionLabelMeta } from 'react-select';

/**
 * Adviser data structure from backend
 */
interface Adviser {
  id: number;
  name: string;
  research_count: number;
}

/**
 * Option format for react-select
 */
interface AdviserOption {
  value: number;
  label: string;
  adviser: Adviser;
}

interface AdviserSelectProps {
  advisers: Adviser[];
  selectedAdviserIds: number[];
  onChange: (selectedIds: number[]) => void;
}

/**
 * Custom styles for react-select to match Tailwind blue theme
 */
const customStyles: StylesConfig<AdviserOption, true> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '42px',
    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    borderRadius: '0.5rem',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
    },
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#dbeafe',
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#1e40af',
    fontSize: '0.875rem',
    padding: '2px 6px',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#3b82f6',
    '&:hover': {
      backgroundColor: '#3b82f6',
      color: 'white',
      cursor: 'pointer',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
      ? '#dbeafe'
      : 'white',
    color: state.isSelected ? 'white' : '#111827',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#2563eb',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  }),
};

/**
 * AdviserSelect component - Multi-select dropdown for filtering by advisers
 * Uses react-select with custom Tailwind-inspired styling
 */
export default function AdviserSelect({
  advisers,
  selectedAdviserIds,
  onChange,
}: AdviserSelectProps) {
  /**
   * Format adviser data for display
   * Format: "LastName, FirstName (12)"
   */
  const formatAdviserLabel = (adviser: Adviser): string => {
    return `${adviser.name} (${adviser.research_count})`;
  };

  /**
   * Convert advisers array to react-select options
   * Sorted alphabetically by last name
   */
  const flatOptions: AdviserOption[] = useMemo(() => {
    return advisers
      .map((adviser) => ({
        value: adviser.id,
        label: formatAdviserLabel(adviser),
        adviser,
      }))
      .sort((a, b) => {
        // Extract last name for sorting (assumes format "LastName, FirstName")
        const lastNameA = a.adviser.name.split(',')[0].trim();
        const lastNameB = b.adviser.name.split(',')[0].trim();
        return lastNameA.localeCompare(lastNameB);
      });
  }, [advisers]);

  const groupedOptions: GroupBase<AdviserOption>[] = useMemo(() => {
    const groups = new Map<string, AdviserOption[]>();
    flatOptions.forEach((option) => {
      const lastName = option.adviser.name.split(',')[0].trim();
      const initial = lastName.charAt(0).toUpperCase();
      const existing = groups.get(initial) || [];
      existing.push(option);
      groups.set(initial, existing);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, options]) => ({ label, options }));
  }, [flatOptions]);

  /**
   * Get currently selected options based on IDs
   */
  const selectedOptions = useMemo(() => {
    return flatOptions.filter((option) => selectedAdviserIds.includes(option.value));
  }, [flatOptions, selectedAdviserIds]);

  /**
   * Compute a mobile-friendly max menu height
   */
  const menuMaxHeight = useMemo(() => {
    if (typeof window !== 'undefined') {
      return Math.max(160, Math.floor(window.innerHeight * 0.6));
    }
    return 300;
  }, []);

  /**
   * Handle selection change
   * Convert from react-select option format to array of IDs
   */
  const handleChange = (selected: MultiValue<AdviserOption>) => {
    const selectedIds = selected.map((option) => option.value);
    onChange(selectedIds);
  };

  return (
    <div className="w-full">
      <label
        htmlFor="adviser-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Filter by Adviser
      </label>
      <Select<AdviserOption, true, GroupBase<AdviserOption>>
        id="adviser-select"
        isMulti
        options={groupedOptions}
        value={selectedOptions}
        onChange={handleChange}
        styles={customStyles}
        placeholder="Select advisers..."
        noOptionsMessage={() => 'No advisers found'}
        isSearchable
        isClearable
        closeMenuOnSelect={false}
        menuPosition="fixed"
        menuShouldBlockScroll
        formatOptionLabel={(option: AdviserOption, meta: FormatOptionLabelMeta<AdviserOption>) =>
          meta.context === 'menu' ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">{option.adviser.name}</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                {option.adviser.research_count}
              </span>
            </div>
          ) : (
            <span>{option.adviser.name}</span>
          )
        }
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        menuPlacement="auto"
        maxMenuHeight={menuMaxHeight}
        className="text-sm"
        classNamePrefix="adviser-select"
      />
      
      {/* Helper text */}
      {selectedAdviserIds.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {selectedAdviserIds.length} adviser{selectedAdviserIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}