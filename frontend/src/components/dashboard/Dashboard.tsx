import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  HStack,
  VStack,
  Spinner,
  Center,
  Badge,
  Link,
  Flex,
  Card,
  Image,
  Grid,
} from '@chakra-ui/react';
import {
  FiBook,
  FiBookOpen,
  FiCheckCircle,
  FiPauseCircle,
  FiXCircle,
  FiClock,
  FiTrendingUp,
  FiTag,
  FiBell,
  FiStar,
  FiImage,
  FiPercent,
  FiArrowUpRight,
  FiCalendar,
} from 'react-icons/fi';
import { statsApi, tagsApi, remindersApi } from '../../services/api';
import { getImageUrl } from '../../config/api';
import type { Stats, Manga, Tag, Reminder } from '../../types/manga';
import { Link as RouterLink } from 'react-router-dom';

// Configuração dos cards de status
const statusCardsConfig = [
  {
    key: 'total',
    label: 'Total',
    icon: FiBook,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    key: 'reading',
    label: 'Lendo',
    icon: FiBookOpen,
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    key: 'completed',
    label: 'Completos',
    icon: FiCheckCircle,
    gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    key: 'paused',
    label: 'Pausados',
    icon: FiPauseCircle,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    key: 'dropped',
    label: 'Abandonados',
    icon: FiXCircle,
    gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    key: 'plan_to_read',
    label: 'Planejo Ler',
    icon: FiClock,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    iconBg: 'rgba(255,255,255,0.2)',
  },
];

// Card de estatística individual
function StatCard({ config, value }: { config: typeof statusCardsConfig[0]; value: number }) {
  const IconComponent = config.icon;
  return (
    <Box
      p={5}
      borderRadius="xl"
      bg={config.gradient}
      position="relative"
      overflow="hidden"
      shadow="lg"
      transition="all 0.3s ease"
      _hover={{ transform: 'translateY(-4px)', shadow: '2xl' }}
      cursor="default"
    >
      {/* Círculo decorativo */}
      <Box
        position="absolute"
        right={-4}
        top={-4}
        w="80px"
        h="80px"
        borderRadius="full"
        bg="rgba(255,255,255,0.1)"
      />
      <Box
        position="absolute"
        right={6}
        bottom={-6}
        w="60px"
        h="60px"
        borderRadius="full"
        bg="rgba(255,255,255,0.05)"
      />

      <VStack align="start" gap={1} position="relative" zIndex={1}>
        <Flex
          w={10}
          h={10}
          bg={config.iconBg}
          borderRadius="lg"
          align="center"
          justify="center"
          mb={1}
        >
          <Box as={IconComponent} size="20px" color="white" />
        </Flex>
        <Text fontSize="sm" color="whiteAlpha.800" fontWeight="medium">
          {config.label}
        </Text>
        <Text fontSize="3xl" fontWeight="bold" color="white" lineHeight={1}>
          {value.toLocaleString('pt-BR')}
        </Text>
      </VStack>
    </Box>
  );
}

// Card de resumo com ícone
function SummaryCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
}) {
  return (
    <Flex
      p={5}
      bg="gray.800"
      borderRadius="xl"
      align="center"
      gap={4}
      border="1px solid"
      borderColor="gray.700"
      transition="all 0.2s"
      _hover={{ borderColor: 'gray.600' }}
    >
      <Flex
        w={12}
        h={12}
        bg={`${color}.900`}
        borderRadius="xl"
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Box as={icon} size="24px" color={`${color}.400`} />
      </Flex>
      <Box>
        <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          {value}
          {suffix && <Text as="span" fontSize="lg" color="gray.400">{suffix}</Text>}
        </Text>
      </Box>
    </Flex>
  );
}

// Item de mangá na lista
function MangaListItem({
  manga,
  showRating,
  showDate,
}: {
  manga: Manga;
  showRating?: boolean;
  showDate?: boolean;
}) {
  return (
    <Link as={RouterLink} to={`/mangas/${manga.id}`} _hover={{ textDecoration: 'none' }} w="100%">
      <Flex
        p={3}
        borderRadius="lg"
        bg="gray.750"
        _hover={{ bg: 'gray.700', transform: 'translateX(4px)' }}
        transition="all 0.2s"
        align="center"
        gap={3}
        w="100%"
      >
        {/* Thumbnail */}
        <Box
          w="40px"
          h="56px"
          borderRadius="md"
          overflow="hidden"
          flexShrink={0}
          bg="gray.700"
        >
          {manga.image_filename ? (
            <Image
              src={getImageUrl(manga.image_filename)}
              alt={manga.primary_title}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          ) : (
            <Flex w="100%" h="100%" align="center" justify="center">
              <Box as={FiBook} color="gray.500" />
            </Flex>
          )}
        </Box>

        {/* Info */}
        <Box flex={1} minW={0}>
          <Text fontWeight="semibold" color="white" fontSize="sm" noOfLines={1}>
            {manga.primary_title}
          </Text>
          <HStack mt={1} gap={2}>
            {showRating && manga.rating && (
              <Badge
                colorPalette="yellow"
                variant="subtle"
                fontSize="xs"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <Box as={FiStar} fontSize="10px" />
                {parseFloat(String(manga.rating)).toFixed(2)}
              </Badge>
            )}
            <Badge colorPalette="blue" variant="subtle" fontSize="xs">
              Cap. {manga.last_chapter_read || 0}
            </Badge>
          </HStack>
        </Box>

        {/* Data ou Arrow */}
        {showDate ? (
          <Text fontSize="xs" color="gray.500" flexShrink={0}>
            {new Date(manga.updated_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : (
          <Box as={FiArrowUpRight} color="gray.500" />
        )}
      </Flex>
    </Link>
  );
}

// Seção com título
function SectionCard({
  icon,
  title,
  iconColor,
  children,
  badge,
}: {
  icon: any;
  title: string;
  iconColor: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Card.Root bg="gray.800" borderColor="gray.700" borderWidth="1px" shadow="lg" overflow="hidden">
      <Card.Header py={4} px={5} borderBottom="1px solid" borderColor="gray.700">
        <Flex align="center" justify="space-between">
          <HStack gap={3}>
            <Flex
              w={8}
              h={8}
              bg={`${iconColor}.900`}
              borderRadius="lg"
              align="center"
              justify="center"
            >
              <Box as={icon} size="16px" color={`${iconColor}.400`} />
            </Flex>
            <Heading size="sm" color="white" fontWeight="semibold">
              {title}
            </Heading>
          </HStack>
          {badge !== undefined && badge > 0 && (
            <Badge colorPalette={iconColor} variant="solid" borderRadius="full" px={2}>
              {badge}
            </Badge>
          )}
        </Flex>
      </Card.Header>
      <Card.Body p={4}>{children}</Card.Body>
    </Card.Root>
  );
}

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
      <Center h="60vh">
        <VStack gap={4}>
          <Spinner size="xl" color="blue.400" thickness="3px" />
          <Text color="gray.400">Carregando dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !stats) {
    return (
      <Center h="60vh">
        <VStack gap={4}>
          <Box
            w={16}
            h={16}
            borderRadius="full"
            bg="red.900"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box as={FiXCircle} size="32px" color="red.400" />
          </Box>
          <Text color="red.400" fontSize="lg" fontWeight="medium">
            {error || 'Erro ao carregar dados'}
          </Text>
          <Box
            as="button"
            px={6}
            py={2}
            bg="red.600"
            color="white"
            borderRadius="lg"
            fontWeight="medium"
            _hover={{ bg: 'red.500' }}
            onClick={loadData}
          >
            Tentar novamente
          </Box>
        </VStack>
      </Center>
    );
  }

  const coverPercentage = stats.total > 0 ? (stats.with_covers / stats.total) * 100 : 0;

  return (
    <Box w="100%" maxW="1600px" mx="auto">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="2xl" color="white" fontWeight="bold">
              Dashboard
            </Heading>
            <Text color="gray.500" mt={1}>
              Visão geral da sua coleção de mangás
            </Text>
          </Box>
        </Flex>

        {/* Status Cards */}
        <SimpleGrid columns={{ base: 2, sm: 3, lg: 6 }} gap={4}>
          {statusCardsConfig.map((config) => (
            <StatCard
              key={config.key}
              config={config}
              value={stats[config.key as keyof Stats] as number}
            />
          ))}
        </SimpleGrid>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <SummaryCard
            icon={FiImage}
            label="Com Capas"
            value={stats.with_covers.toLocaleString('pt-BR')}
            color="green"
          />
          <SummaryCard
            icon={FiStar}
            label="Nota Média"
            value={stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 'N/A'}
            color="yellow"
          />
          <Box
            p={5}
            bg="gray.800"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.700"
          >
            <Flex align="center" gap={4}>
              <Flex
                w={12}
                h={12}
                bg="purple.900"
                borderRadius="xl"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Box as={FiPercent} size="24px" color="purple.400" />
              </Flex>
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase">
                  Cobertura de Capas
                </Text>
                <HStack gap={3} mt={1}>
                  <Text fontSize="2xl" fontWeight="bold" color="white">
                    {coverPercentage.toFixed(1)}%
                  </Text>
                  <Box flex={1} h="6px" bg="gray.700" borderRadius="full" overflow="hidden">
                    <Box
                      h="100%"
                      w={`${coverPercentage}%`}
                      bg="purple.500"
                      borderRadius="full"
                      transition="width 0.3s ease"
                    />
                  </Box>
                </HStack>
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>

        {/* Content Grid */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
          {/* Mais Lidos */}
          <SectionCard icon={FiTrendingUp} title="Mais Lidos" iconColor="green">
            <VStack align="stretch" gap={2}>
              {topRead.length > 0 ? (
                topRead.map((manga) => (
                  <MangaListItem key={manga.id} manga={manga} showRating />
                ))
              ) : (
                <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                  Nenhum mangá encontrado
                </Text>
              )}
            </VStack>
          </SectionCard>

          {/* Atualizados Recentemente */}
          <SectionCard icon={FiClock} title="Atualizados Recentemente" iconColor="blue">
            <VStack align="stretch" gap={2}>
              {recentlyUpdated.length > 0 ? (
                recentlyUpdated.map((manga) => (
                  <MangaListItem key={manga.id} manga={manga} showDate />
                ))
              ) : (
                <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                  Nenhuma atualização recente
                </Text>
              )}
            </VStack>
          </SectionCard>

          {/* Tags Populares */}
          <SectionCard icon={FiTag} title="Tags Populares" iconColor="purple">
            {popularTags.length > 0 ? (
              <Flex flexWrap="wrap" gap={2}>
                {popularTags.map((tag, index) => (
                  <Badge
                    key={tag.id}
                    colorPalette={index < 3 ? 'purple' : 'gray'}
                    variant={index < 3 ? 'solid' : 'subtle'}
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="medium"
                    cursor="pointer"
                    _hover={{ opacity: 0.8 }}
                    transition="all 0.2s"
                  >
                    {tag.name}
                    <Text as="span" ml={1} opacity={0.7}>
                      ({tag.usage_count || 0})
                    </Text>
                  </Badge>
                ))}
              </Flex>
            ) : (
              <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                Nenhuma tag encontrada
              </Text>
            )}
          </SectionCard>

          {/* Lembretes */}
          <SectionCard
            icon={FiBell}
            title="Lembretes"
            iconColor="orange"
            badge={reminders.length}
          >
            <VStack align="stretch" gap={2}>
              {reminders.length > 0 ? (
                reminders.slice(0, 5).map((reminder) => (
                  <Box
                    key={reminder.id}
                    p={3}
                    borderRadius="lg"
                    bg="orange.950"
                    borderLeft="3px solid"
                    borderLeftColor="orange.500"
                    transition="all 0.2s"
                    _hover={{ bg: 'orange.900' }}
                  >
                    <Text fontWeight="medium" color="white" fontSize="sm" noOfLines={1}>
                      {reminder.message || 'Sem mensagem'}
                    </Text>
                    {reminder.scheduled_for && (
                      <HStack mt={2} gap={1} color="orange.300" fontSize="xs">
                        <Box as={FiCalendar} />
                        <Text>
                          {new Date(reminder.scheduled_for).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </HStack>
                    )}
                  </Box>
                ))
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py={8}
                  color="gray.500"
                >
                  <Box as={FiBell} size="32px" opacity={0.5} mb={2} />
                  <Text fontSize="sm">Nenhum lembrete pendente</Text>
                </Flex>
              )}
            </VStack>
          </SectionCard>
        </Grid>
      </VStack>
    </Box>
  );
}
