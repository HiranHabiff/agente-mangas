import { useState, useEffect, useRef } from 'react';
import { Box, Flex, Badge, Text } from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  placeholder: string;
  selected: string[];
  options: MultiSelectOption[];
  onChange: (selected: string[]) => void;
  getColor?: (value: string) => string;
  allowCreate?: boolean;
}

export function MultiSelect({
  placeholder,
  selected,
  options,
  onChange,
  getColor,
  allowCreate = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(
    opt => !selected.includes(opt.value) &&
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches any existing option
  const searchMatchesOption = options.some(
    opt => opt.label.toLowerCase() === search.toLowerCase() || opt.value.toLowerCase() === search.toLowerCase()
  );

  // Show create option if allowCreate is true and search doesn't match existing options
  const showCreateOption = allowCreate && search.trim() && !searchMatchesOption && !selected.includes(search.trim());

  const handleSelect = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setSearch('');
    inputRef.current?.focus();
  };

  const handleCreate = () => {
    const newValue = search.trim();
    if (newValue && !selected.includes(newValue)) {
      onChange([...selected, newValue]);
    }
    setSearch('');
    inputRef.current?.focus();
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter(s => s !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !search && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      } else if (allowCreate && showCreateOption) {
        handleCreate();
      }
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box position="relative" ref={containerRef}>
      <Flex
        minH="42px"
        px={3}
        py={1.5}
        bg="gray.700"
        borderRadius="md"
        border="1px solid"
        borderColor={isOpen ? 'blue.400' : 'gray.600'}
        gap={1.5}
        align="center"
        cursor="text"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        _hover={{ borderColor: isOpen ? 'blue.400' : 'gray.500' }}
        transition="all 0.15s"
        flexWrap="wrap"
      >
        {selected.map(value => {
          const opt = options.find(o => o.value === value);
          const color = getColor ? getColor(opt?.label || value) : opt?.color || 'blue';
          return (
            <Badge
              key={value}
              colorPalette={color}
              variant="solid"
              px={2}
              py={0.5}
              borderRadius="full"
              display="flex"
              alignItems="center"
              gap={1}
              fontSize="xs"
              flexShrink={0}
            >
              {opt?.label || value}
              <Box
                as={FiX}
                fontSize="xs"
                cursor="pointer"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleRemove(value);
                }}
                _hover={{ opacity: 0.7 }}
              />
            </Badge>
          );
        })}
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : ''}
          style={{
            flex: 1,
            minWidth: '80px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '14px',
            padding: '4px 0',
          }}
        />
      </Flex>

      {isOpen && (filteredOptions.length > 0 || showCreateOption) && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          maxH="200px"
          overflowY="auto"
          zIndex={1000}
          shadow="xl"
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '3px' },
          }}
        >
          {showCreateOption && (
            <Flex
              px={3}
              py={2}
              cursor="pointer"
              bg="blue.900"
              _hover={{ bg: 'blue.800' }}
              onClick={handleCreate}
              align="center"
              gap={2}
            >
              <Text color="blue.200" fontSize="sm">
                Criar "{search.trim()}"
              </Text>
            </Flex>
          )}
          {filteredOptions.map(opt => {
            const color = getColor ? getColor(opt.label) : opt.color || 'blue';
            return (
              <Flex
                key={opt.value}
                px={3}
                py={2}
                cursor="pointer"
                _hover={{ bg: 'gray.700' }}
                onClick={() => handleSelect(opt.value)}
                align="center"
                gap={2}
              >
                <Box w={2} h={2} borderRadius="full" bg={`${color}.400`} />
                <Text color="gray.200" fontSize="sm">{opt.label}</Text>
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
