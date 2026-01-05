import { useState, useEffect, useRef, useCallback } from 'react';
import { SimpleGrid, Spinner, Center, Text, Box, VStack, HStack } from '@chakra-ui/react';
import { MangaCard } from './MangaCard';
import { mangaApi } from '../../services/api';
import type { Manga } from '../../types/manga';

interface MangaListProps {
  filters?: any;
}

const ITEMS_PER_PAGE = 24;

export function MangaList({ filters }: MangaListProps) {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  // Ref for the sentinel element (trigger for loading more)
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load initial data when filters change
  useEffect(() => {
    setMangas([]);
    setOffset(0);
    setHasMore(true);
    loadMangas(0, true);
  }, [filters]);

  const loadMangas = async (currentOffset: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const result = await mangaApi.list({
        ...filters,
        limit: ITEMS_PER_PAGE,
        offset: currentOffset
      });

      const newMangas = result.data || [];
      setTotal(result.total || 0);

      if (isInitial) {
        setMangas(newMangas);
      } else {
        setMangas(prev => [...prev, ...newMangas]);
      }

      // Check if there are more items to load
      const loadedCount = currentOffset + newMangas.length;
      setHasMore(loadedCount < (result.total || 0));
      setOffset(currentOffset + newMangas.length);

    } catch (err) {
      console.error('Erro ao carregar mangás:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mangás');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Intersection Observer callback
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
      loadMangas(offset, false);
    }
  }, [hasMore, loading, loadingMore, offset, filters]);

  // Setup Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px', // Start loading 200px before reaching the sentinel
      threshold: 0,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  // Reload function for MangaCard updates
  const handleMangaUpdate = () => {
    setMangas([]);
    setOffset(0);
    setHasMore(true);
    loadMangas(0, true);
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
      <HStack justify="space-between" mb={4}>
        <Text color="gray.400">
          {mangas.length} de {total} mangá(s)
        </Text>
        {hasMore && (
          <Text color="gray.500" fontSize="sm">
            Role para carregar mais
          </Text>
        )}
      </HStack>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 6 }} gap={4}>
        {mangas.map((manga) => (
          <MangaCard key={manga.id} manga={manga} onUpdate={handleMangaUpdate} />
        ))}
      </SimpleGrid>

      {mangas.length === 0 && !loading && (
        <Center h="200px">
          <Text color="gray.400" fontSize="lg">Nenhum mangá encontrado</Text>
        </Center>
      )}

      {/* Sentinel element for infinite scroll */}
      <Box ref={sentinelRef} h="1px" />

      {/* Loading more indicator */}
      {loadingMore && (
        <Center py={8}>
          <HStack gap={3}>
            <Spinner size="md" color="blue.500" />
            <Text color="gray.400">Carregando mais...</Text>
          </HStack>
        </Center>
      )}

      {/* End of list indicator */}
      {!hasMore && mangas.length > 0 && (
        <Center py={8}>
          <Text color="gray.500" fontSize="sm">
            Fim da lista • {total} mangá(s) no total
          </Text>
        </Center>
      )}
    </Box>
  );
}
