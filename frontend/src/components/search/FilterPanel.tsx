import { Box, Input, Button, HStack, VStack, Text } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';

interface FilterPanelProps {
  onFilterChange: (filters: any) => void;
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [query, setQuery] = useState('');

  // Debounce effect - executa busca automaticamente após 500ms de digitação
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ query: query || undefined });
    }, 500);

    return () => clearTimeout(timer);
  }, [query, onFilterChange]);

  const handleClear = useCallback(() => {
    setQuery('');
    onFilterChange({});
  }, [onFilterChange]);

  return (
    <Box p={4} borderWidth="1px" borderColor="gray.700" borderRadius="md" bg="gray.800">
      <VStack gap={3} align="stretch">
        <Text fontWeight="bold" color="white">Buscar Mangás</Text>
        <Input
          placeholder="Digite o título... (busca automática)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          bg="gray.700"
          borderColor="gray.600"
          color="white"
          _placeholder={{ color: 'gray.400' }}
        />
        <HStack>
          <Button onClick={handleClear} variant="outline" colorScheme="gray">
            Limpar
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
