import { useState } from 'react';
import { Box, Flex, Badge } from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';

interface ChipInputProps {
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  colorScheme?: string;
}

export function ChipInput({
  placeholder,
  values,
  onChange,
  colorScheme = 'gray',
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
  };

  const removeValue = (valueToRemove: string) => {
    onChange(values.filter(v => v !== valueToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addValue(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      removeValue(values[values.length - 1]);
    }
  };

  return (
    <Box
      bg="gray.700"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.600"
      _focusWithin={{ borderColor: 'blue.400' }}
      transition="all 0.15s"
    >
      <Flex
        minH="42px"
        px={3}
        py={1.5}
        gap={1.5}
        align="center"
        flexWrap="wrap"
      >
        {values.map((value, index) => (
          <Badge
            key={`${value}-${index}`}
            colorPalette={colorScheme}
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
            {value}
            <Box
              as={FiX}
              fontSize="xs"
              cursor="pointer"
              onClick={() => removeValue(value)}
              _hover={{ opacity: 0.7 }}
            />
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue.trim() && addValue(inputValue)}
          placeholder={values.length === 0 ? placeholder : ''}
          style={{
            flex: 1,
            minWidth: '100px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '14px',
            padding: '4px 0',
          }}
        />
      </Flex>
    </Box>
  );
}
