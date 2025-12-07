import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Select,
  Switch,
  Tag,
  Text,
  VStack,
  Collapsible,
  IconButton,
  Badge,
  Separator,
  NumberInput,
} from '@chakra-ui/react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { mangaApi } from '../../services/api';

interface AdvancedFilterPanelProps {
  onFilterChange: (filters: any) => void;
}

export function AdvancedFilterPanel({ onFilterChange }: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Estados dos filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<string>('');
  const [onlyWithCovers, setOnlyWithCovers] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const statusOptions = [
    { value: 'reading', label: 'Lendo', color: 'green' },
    { value: 'completed', label: 'Completo', color: 'purple' },
    { value: 'paused', label: 'Pausado', color: 'orange' },
    { value: 'dropped', label: 'Abandonado', color: 'red' },
    { value: 'plan_to_read', label: 'Planos de Ler', color: 'cyan' },
  ];

  // Carregar tags disponíveis
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await mangaApi.getTags();
      setAvailableTags(tags.map((t: any) => t.name));
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
    }
  };

  // Aplicar filtros quando mudarem
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedStatus, selectedTags, minRating, onlyWithCovers, sortBy, sortOrder]);

  const applyFilters = () => {
    const filters: any = {};

    if (searchQuery.trim()) {
      filters.query = searchQuery.trim();
    }

    if (selectedStatus.length > 0) {
      filters.status = selectedStatus;
    }

    if (selectedTags.length > 0) {
      filters.tags = selectedTags;
    }

    if (minRating && parseFloat(minRating) > 0) {
      filters.min_rating = parseFloat(minRating);
    }

    if (onlyWithCovers) {
      filters.with_covers = true;
    }

    filters.sort_by = sortBy;
    filters.sort_order = sortOrder;

    onFilterChange(filters);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatus([]);
    setSelectedTags([]);
    setMinRating('');
    setOnlyWithCovers(false);
    setSortBy('updated_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedStatus.length > 0 || 
    selectedTags.length > 0 || 
    minRating || 
    onlyWithCovers;

  return (
    <Card.Root bg="gray.800" borderColor="gray.700" borderWidth="1px">
      <Card.Header p={4}>
        <Flex justify="space-between" align="center">
          <HStack gap={3}>
            <Box as={FiFilter} fontSize="xl" color="blue.400" />
            <Heading size="lg" color="white">
              Filtros
            </Heading>
            {hasActiveFilters && (
              <Badge colorScheme="blue" fontSize="sm">
                {[
                  searchQuery ? 1 : 0,
                  selectedStatus.length,
                  selectedTags.length,
                  minRating ? 1 : 0,
                  onlyWithCovers ? 1 : 0
                ].reduce((a, b) => a + b, 0)} ativos
              </Badge>
            )}
          </HStack>
          <HStack gap={2}>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={clearAllFilters}
                leftIcon={<Box as={FiX} />}
              >
                Limpar
              </Button>
            )}
            <IconButton
              aria-label={isOpen ? 'Fechar filtros' : 'Abrir filtros'}
              icon={<Box as={isOpen ? FiChevronUp : FiChevronDown} />}
              onClick={() => setIsOpen(!isOpen)}
              variant="ghost"
              size="sm"
              color="gray.400"
              _hover={{ color: 'white', bg: 'gray.700' }}
            />
          </HStack>
        </Flex>
      </Card.Header>

      <Collapsible.Root open={isOpen}>
        <Collapsible.Content>
          <Card.Body pt={0} p={4}>
            <VStack align="stretch" gap={4}>
              {/* Busca */}
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Buscar mangá por título..."
                size="md"
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.500' }}
                _focus={{ borderColor: 'blue.500', shadow: 'md' }}
              />

              {/* Status */}
              <Box>
                <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={2}>
                  STATUS
                </Text>
                <Flex flexWrap="wrap" gap={2}>
                  {statusOptions.map((status) => (
                    <Tag.Root
                      key={status.value}
                      size="sm"
                      variant={selectedStatus.includes(status.value) ? 'solid' : 'outline'}
                      colorScheme={status.color}
                      cursor="pointer"
                      onClick={() => toggleStatus(status.value)}
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      <Tag.Label color="white">
                        {status.label}
                      </Tag.Label>
                    </Tag.Root>
                  ))}
                </Flex>
              </Box>

              {/* Tags */}
              {availableTags.length > 0 && (
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={2}>
                    TAGS
                  </Text>
                  <Flex flexWrap="wrap" gap={1.5} maxH="120px" overflowY="auto">
                    {availableTags.map((tag) => (
                      <Tag.Root
                        key={tag}
                        size="sm"
                        variant={selectedTags.includes(tag) ? 'solid' : 'outline'}
                        colorScheme="purple"
                        cursor="pointer"
                        onClick={() => toggleTag(tag)}
                        _hover={{ transform: 'scale(1.05)' }}
                        transition="all 0.2s"
                      >
                        <Tag.Label fontSize="xs" color="white">
                          {tag}
                        </Tag.Label>
                        {selectedTags.includes(tag) && (
                          <Tag.CloseTrigger onClick={(e) => {
                            e.stopPropagation();
                            toggleTag(tag);
                          }} />
                        )}
                      </Tag.Root>
                    ))}
                  </Flex>
                </Box>
              )}

              {/* Filtros Avançados - 4 colunas */}
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={1.5}>
                    AVALIAÇÃO MIN.
                  </Text>
                  <NumberInput.Root
                    value={minRating}
                    onValueChange={(details) => setMinRating(details.value)}
                    min={0}
                    max={10}
                    step={0.5}
                    size="sm"
                  >
                    <NumberInput.Input
                      bg="gray.700"
                      borderColor="gray.600"
                      color="white"
                      placeholder="0.0 - 10.0"
                      fontSize="sm"
                      _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                    />
                  </NumberInput.Root>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={1.5}>
                    COM CAPAS
                  </Text>
                  <HStack
                    h="32px"
                    px={3}
                    bg="gray.700"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.600"
                    justify="space-between"
                  >
                    <Text color="white" fontSize="xs">
                      Apenas
                    </Text>
                    <Switch.Root
                      checked={onlyWithCovers}
                      onCheckedChange={(e) => setOnlyWithCovers(e.checked)}
                      colorScheme="blue"
                      size="sm"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={1.5}>
                    ORDENAR POR
                  </Text>
                  <Select.Root
                    value={[sortBy]}
                    onValueChange={(e) => setSortBy(e.value[0])}
                    size="sm"
                  >
                    <Select.Trigger bg="gray.700" borderColor="gray.600" color="white" fontSize="sm">
                      <Select.ValueText placeholder="Selecione" />
                    </Select.Trigger>
                    <Select.Content bg="gray.700" borderColor="gray.600">
                      <Select.Item item="updated_at" color="white">Atualização</Select.Item>
                      <Select.Item item="created_at" color="white">Criação</Select.Item>
                      <Select.Item item="primary_title" color="white">Título</Select.Item>
                      <Select.Item item="rating" color="white">Avaliação</Select.Item>
                      <Select.Item item="last_chapter_read" color="white">Progresso</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={1.5}>
                    ORDEM
                  </Text>
                  <Select.Root
                    value={[sortOrder]}
                    onValueChange={(e) => setSortOrder(e.value[0])}
                    size="sm"
                  >
                    <Select.Trigger bg="gray.700" borderColor="gray.600" color="white" fontSize="sm">
                      <Select.ValueText placeholder="Ordem" />
                    </Select.Trigger>
                    <Select.Content bg="gray.700" borderColor="gray.600">
                      <Select.Item item="desc" color="white">⬇ Decrescente</Select.Item>
                      <Select.Item item="asc" color="white">⬆ Crescente</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Grid>
            </VStack>
          </Card.Body>
        </Collapsible.Content>
      </Collapsible.Root>
    </Card.Root>
  );
}
