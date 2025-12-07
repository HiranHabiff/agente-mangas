import { useState, useEffect } from 'react';
import { SimpleGrid, Spinner, Center, Text, Box, VStack } from '@chakra-ui/react';
import { MangaCard } from './MangaCard';
import { mangaApi } from '../../services/api';
import type { Manga } from '../../types/manga';

interface MangaListProps {
  filters?: any;
}

export function MangaList({ filters }: MangaListProps) {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMangas();
  }, [filters]);

  const loadMangas = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await mangaApi.list({ ...filters, limit: 50 });
      console.log('Mangás carregados:', result);
      setMangas(result.data || []);
    } catch (err) {
      console.error('Erro ao carregar mangás:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mangás');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={3}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.400">Carregando mangás...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="400px">
        <VStack gap={3}>
          <Text color="red.400" fontSize="lg">Erro ao carregar mangás</Text>
          <Text color="gray.400">{error}</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Text color="gray.400" mb={4}>
        {mangas.length} mangá(s) encontrado(s)
      </Text>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 6 }} gap={4}>
        {mangas.map((manga) => (
          <MangaCard key={manga.id} manga={manga} onUpdate={loadMangas} />
        ))}
      </SimpleGrid>
      {mangas.length === 0 && (
        <Center h="200px">
          <Text color="gray.400" fontSize="lg">Nenhum mangá encontrado</Text>
        </Center>
      )}
    </Box>
  );
}
