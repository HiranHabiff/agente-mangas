import { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Text, HStack, VStack, Spinner, Center, Badge, Link } from '@chakra-ui/react';
import { FiBook, FiBookOpen, FiCheckCircle, FiPause, FiX, FiClock, FiTrendingUp, FiTag, FiBell } from 'react-icons/fi';
import { statsApi, tagsApi, remindersApi } from '../../services/api';
import type { Stats, Manga, Tag, Reminder } from '../../types/manga';
import { Link as RouterLink } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topRead, setTopRead] = useState<Manga[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Manga[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, topReadData, recentData, tagsData, remindersData] = await Promise.all([
        statsApi.getStats(),
        statsApi.getTopRead(5),
        statsApi.getRecentlyUpdated(5),
        tagsApi.getPopular(8),
        remindersApi.list(),
      ]);
      
      console.log('Dashboard data loaded:', { statsData, topReadData, recentData, tagsData, remindersData });
      
      setStats(statsData);
      setTopRead(topReadData);
      setRecentlyUpdated(recentData);
      setPopularTags(tagsData);
      setReminders(remindersData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Spinner size="xl" />
          <Text>Carregando estatísticas...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !stats) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Text color="red.500" fontSize="lg">{error || 'Erro ao carregar dados'}</Text>
          <button onClick={loadData}>Tentar novamente</button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box w="100%">
      <VStack gap={6} align="stretch" w="100%">
        <Heading size="xl" color="white">Dashboard</Heading>

        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4} w="100%">
          <Box p={6} borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" shadow="md">
            <VStack align="start" gap={2}>
              <HStack color="blue.500">
                <Box as={FiBook} size="20px" />
                <Text fontSize="sm" fontWeight="medium">Total</Text>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                {stats.total}
              </Text>
            </VStack>
          </Box>

          <Box p={6} borderWidth="1px" borderColor="green.700" borderRadius="lg" bg="green.900" shadow="md">
            <VStack align="start" gap={2}>
              <HStack color="green.600">
                <Box as={FiBookOpen} size="20px" />
                <Text fontSize="sm" fontWeight="medium">Lendo</Text>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="green.600">
                {stats.reading}
              </Text>
            </VStack>
          </Box>

          <Box p={6} borderWidth="1px" borderColor="purple.700" borderRadius="lg" bg="purple.900" shadow="md">
            <VStack align="start" gap={2}>
              <HStack color="purple.600">
                <Box as={FiCheckCircle} size="20px" />
                <Text fontSize="sm" fontWeight="medium">Completos</Text>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                {stats.completed}
              </Text>
            </VStack>
          </Box>

          <Box p={6} borderWidth="1px" borderColor="orange.700" borderRadius="lg" bg="orange.900" shadow="md">
            <VStack align="start" gap={2}>
              <HStack color="orange.600">
                <Box as={FiPause} size="20px" />
                <Text fontSize="sm" fontWeight="medium">Pausados</Text>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="orange.600">
                {stats.paused}
              </Text>
            </VStack>
          </Box>

          <Box p={6} borderWidth="1px" borderColor="red.700" borderRadius="lg" bg="red.900" shadow="md">
            <VStack align="start" gap={2}>
              <HStack color="red.600">
                <Box as={FiX} size="20px" />
                <Text fontSize="sm" fontWeight="medium">Abandonados</Text>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="red.600">
                {stats.dropped}
              </Text>
            </VStack>
          </Box>

          <Box p={6} borderWidth="1px" borderColor="cyan.700" borderRadius="lg" bg="cyan.900" shadow="md">
            <VStack align="start" gap={2}>
              <HStack color="cyan.600">
                <Box as={FiClock} size="20px" />
                <Text fontSize="sm" fontWeight="medium">Planos</Text>
              </HStack>
              <Text fontSize="3xl" fontWeight="bold" color="cyan.600">
                {stats.plan_to_read}
              </Text>
            </VStack>
          </Box>
        </SimpleGrid>

        <Box p={6} borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" shadow="md" w="100%">
          <Heading size="md" mb={4} color="white">Resumo</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="100%">
            <Box>
              <Text fontSize="sm" color="gray.400">Com Capas</Text>
              <Text fontSize="2xl" fontWeight="bold" color="white">{stats.with_covers}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.400">Nota Média</Text>
              <Text fontSize="2xl" fontWeight="bold" color="white">
                {stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 'N/A'}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.400">% com Capas</Text>
              <Text fontSize="2xl" fontWeight="bold" color="white">
                {stats.total > 0 ? ((stats.with_covers / stats.total) * 100).toFixed(1) : '0'}%
              </Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Grid de conteúdo adicional */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} w="100%">
          {/* Mangás mais lidos */}
          <Box p={6} borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" shadow="md">
            <HStack mb={4}>
              <Box as={FiTrendingUp} size="20px" color="green.500" />
              <Heading size="md" color="white">Mais Lidos</Heading>
            </HStack>
            <VStack align="stretch" gap={3}>
              {topRead.length > 0 ? (
                topRead.map((manga) => (
                  <Link 
                    key={manga.id} 
                    as={RouterLink} 
                    to={`/mangas/${manga.id}`}
                    _hover={{ textDecoration: 'none' }}
                  >
                    <Box 
                      p={3} 
                      borderRadius="md" 
                      bg="gray.700" 
                      _hover={{ bg: 'gray.600' }}
                      transition="all 0.2s"
                    >
                      <Text fontWeight="bold" color="white" noOfLines={1}>
                        {manga.primary_title}
                      </Text>
                      <HStack mt={1}>
                        {manga.rating && (
                          <Badge colorScheme="yellow">⭐ {manga.rating}</Badge>
                        )}
                        <Badge colorScheme="blue">
                          {manga.last_chapter_read || 0}/{manga.total_chapters || '?'}
                        </Badge>
                      </HStack>
                    </Box>
                  </Link>
                ))
              ) : (
                <Text color="gray.500" fontSize="sm">Nenhum dado disponível</Text>
              )}
            </VStack>
          </Box>

          {/* Atualizações recentes */}
          <Box p={6} borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" shadow="md">
            <HStack mb={4}>
              <Box as={FiClock} size="20px" color="blue.500" />
              <Heading size="md" color="white">Atualizados Recentemente</Heading>
            </HStack>
            <VStack align="stretch" gap={3}>
              {recentlyUpdated.length > 0 ? (
                recentlyUpdated.map((manga) => (
                  <Link 
                    key={manga.id} 
                    as={RouterLink} 
                    to={`/mangas/${manga.id}`}
                    _hover={{ textDecoration: 'none' }}
                  >
                    <Box 
                      p={3} 
                      borderRadius="md" 
                      bg="gray.700" 
                      _hover={{ bg: 'gray.600' }}
                      transition="all 0.2s"
                    >
                      <Text fontWeight="bold" color="white" noOfLines={1}>
                        {manga.primary_title}
                      </Text>
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {new Date(manga.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Box>
                  </Link>
                ))
              ) : (
                <Text color="gray.500" fontSize="sm">Nenhum dado disponível</Text>
              )}
            </VStack>
          </Box>

          {/* Tags populares */}
          <Box p={6} borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" shadow="md">
            <HStack mb={4}>
              <Box as={FiTag} size="20px" color="purple.500" />
              <Heading size="md" color="white">Tags Populares</Heading>
            </HStack>
            <HStack flexWrap="wrap" gap={2}>
              {popularTags.length > 0 ? (
                popularTags.map((tag) => (
                  <Badge 
                    key={tag.id} 
                    colorScheme="purple" 
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {tag.name} ({tag.usage_count || 0})
                  </Badge>
                ))
              ) : (
                <Text color="gray.500" fontSize="sm">Nenhuma tag disponível</Text>
              )}
            </HStack>
          </Box>

          {/* Lembretes pendentes */}
          <Box p={6} borderWidth="1px" borderColor="gray.700" borderRadius="lg" bg="gray.800" shadow="md">
            <HStack mb={4}>
              <Box as={FiBell} size="20px" color="orange.500" />
              <Heading size="md" color="white">Lembretes</Heading>
              {reminders.length > 0 && (
                <Badge colorScheme="orange" ml="auto">{reminders.length}</Badge>
              )}
            </HStack>
            <VStack align="stretch" gap={3}>
              {reminders.length > 0 ? (
                reminders.slice(0, 5).map((reminder) => (
                  <Box 
                    key={reminder.id}
                    p={3} 
                    borderRadius="md" 
                    bg="orange.900"
                    borderLeft="4px"
                    borderLeftColor="orange.500"
                  >
                    <Text fontWeight="bold" color="white" fontSize="sm" noOfLines={1}>
                      {reminder.message || 'Sem mensagem'}
                    </Text>
                    {reminder.scheduled_for && (
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        📅 {new Date(reminder.scheduled_for).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    )}
                  </Box>
                ))
              ) : (
                <Text color="gray.500" fontSize="sm">Nenhum lembrete pendente</Text>
              )}
            </VStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
