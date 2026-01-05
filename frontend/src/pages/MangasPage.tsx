import { useState } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { AdvancedFilterPanel } from '../components/search/AdvancedFilterPanel';
import { MangaList } from '../components/manga/MangaList';

export function MangasPage() {
  const [filters, setFilters] = useState({
    sort_by: 'last_read_at',
    sort_order: 'desc',
  });

  return (
    <Box w="100%" minH="100vh" bg="gray.900" p={{ base: 4, md: 6 }}>
      <VStack gap={6} align="stretch" maxW="1600px" mx="auto">
        <AdvancedFilterPanel onFilterChange={setFilters} />
        <MangaList filters={filters} />
      </VStack>
    </Box>
  );
}
