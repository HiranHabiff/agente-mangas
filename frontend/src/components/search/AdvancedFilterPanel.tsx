import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  Flex,
  Grid,
  HStack,
  Input,
  Select,
  Switch,
  Text,
  VStack,
  Collapsible,
  IconButton,
  Badge,
  NumberInput,
  createListCollection,
} from '@chakra-ui/react';
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiStar,
  FiImage,
  FiRefreshCw,
} from 'react-icons/fi';
import { mangaApi } from '../../services/api';

interface AdvancedFilterPanelProps {
  onFilterChange: (filters: any) => void;
}

const statusOptions = [
  { value: 'reading', label: 'Lendo', color: 'green' },
  { value: 'completed', label: 'Completo', color: 'purple' },
  { value: 'paused', label: 'Pausado', color: 'orange' },
  { value: 'dropped', label: 'Abandonado', color: 'red' },
  { value: 'plan_to_read', label: 'Planejo Ler', color: 'cyan' },
];

const sortByItems = [
  { value: 'updated_at', label: 'Atualização' },
  { value: 'created_at', label: 'Criação' },
  { value: 'primary_title', label: 'Título' },
  { value: 'rating', label: 'Avaliação' },
  { value: 'last_chapter_read', label: 'Progresso' },
];

const sortOrderItems = [
  { value: 'desc', label: 'Decrescente' },
  { value: 'asc', label: 'Crescente' },
];

const sortByCollection = createListCollection({ items: sortByItems });
const sortOrderCollection = createListCollection({ items: sortOrderItems });

const getTagColor = (tag: string): string => {
  const t = tag.toLowerCase();
  if (['ação', 'action', 'luta', 'artes marciais'].some(x => t.includes(x))) return 'red';
  if (['romance', 'amor', 'shoujo'].some(x => t.includes(x))) return 'pink';
  if (['comédia', 'comedy', 'humor'].some(x => t.includes(x))) return 'yellow';
  if (['fantasia', 'fantasy', 'magia'].some(x => t.includes(x))) return 'purple';
  if (['aventura', 'adventure'].some(x => t.includes(x))) return 'orange';
  if (['drama'].some(x => t.includes(x))) return 'blue';
  if (['horror', 'terror', 'suspense'].some(x => t.includes(x))) return 'gray';
  if (['sci-fi', 'ficção científica', 'mecha'].some(x => t.includes(x))) return 'cyan';
  if (['slice of life', 'cotidiano'].some(x => t.includes(x))) return 'green';
  return 'purple';
};

// Componente de Multi-Select com chips
interface MultiSelectProps {
  placeholder: string;
  selected: string[];
  options: { value: string; label: string; color?: string }[];
  onChange: (selected: string[]) => void;
  getColor?: (value: string) => string;
}

function MultiSelect({ placeholder, selected, options, onChange, getColor }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(
    opt => !selected.includes(opt.value) &&
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (value: string) => {
    onChange([...selected, value]);
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
  };

  // Fechar ao clicar fora
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
        h="36px"
        px={3}
        bg="gray.900"
        borderRadius="md"
        border="1px solid"
        borderColor={isOpen ? 'blue.400' : 'gray.700'}
        gap={1}
        align="center"
        cursor="text"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        _hover={{ borderColor: isOpen ? 'blue.400' : 'gray.600' }}
        transition="all 0.15s"
        overflow="hidden"
      >
        {selected.map(value => {
          const opt = options.find(o => o.value === value);
          const color = getColor ? getColor(opt?.label || value) : opt?.color || 'blue';
          return (
            <Badge
              key={value}
              colorPalette={color}
              variant="solid"
              px={1.5}
              py={0}
              borderRadius="sm"
              display="flex"
              alignItems="center"
              gap={0.5}
              fontSize="2xs"
              h="20px"
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
            minWidth: '60px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '14px',
          }}
        />
      </Flex>

      {isOpen && filteredOptions.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="gray.900"
          border="1px solid"
          borderColor="gray.700"
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

export function AdvancedFilterPanel({ onFilterChange }: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [availableTags, setAvailableTags] = useState<{ value: string; label: string }[]>([]);

  // Estados dos filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<string>('');
  const [onlyWithCovers, setOnlyWithCovers] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await mangaApi.getTags();
      setAvailableTags(tags.map((t: any) => ({ value: t.name, label: t.name })));
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
    }
  };

  useEffect(() => {
    const filters: any = {};
    if (searchQuery.trim()) filters.query = searchQuery.trim();
    if (selectedStatus.length > 0) filters.status = selectedStatus;
    if (selectedTags.length > 0) filters.tags = selectedTags;
    if (minRating && parseFloat(minRating) > 0) filters.min_rating = parseFloat(minRating);
    if (onlyWithCovers) filters.with_covers = true;
    filters.sort_by = sortBy;
    filters.sort_order = sortOrder;
    onFilterChange(filters);
  }, [searchQuery, selectedStatus, selectedTags, minRating, onlyWithCovers, sortBy, sortOrder]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatus([]);
    setSelectedTags([]);
    setMinRating('');
    setOnlyWithCovers(false);
    setSortBy('updated_at');
    setSortOrder('desc');
  };

  const activeCount = [
    searchQuery ? 1 : 0,
    selectedStatus.length,
    selectedTags.length,
    minRating ? 1 : 0,
    onlyWithCovers ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <Card.Root bg="gray.800" borderColor="gray.700" borderWidth="1px" shadow="md" overflow="visible">
      <Card.Header py={3} px={4}>
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <Box as={FiFilter} color="blue.400" />
            <Text color="white" fontWeight="semibold" fontSize="sm">Filtros</Text>
            {activeCount > 0 && (
              <Badge colorPalette="blue" variant="solid" fontSize="xs">
                {activeCount}
              </Badge>
            )}
          </HStack>
          <HStack gap={1}>
            {activeCount > 0 && (
              <IconButton
                aria-label="Limpar filtros"
                size="xs"
                variant="ghost"
                color="gray.400"
                onClick={clearAllFilters}
                _hover={{ color: 'red.300', bg: 'gray.700' }}
              >
                <FiRefreshCw />
              </IconButton>
            )}
            <IconButton
              aria-label={isOpen ? 'Recolher' : 'Expandir'}
              size="xs"
              variant="ghost"
              color="gray.400"
              onClick={() => setIsOpen(!isOpen)}
              _hover={{ color: 'white', bg: 'gray.700' }}
            >
              {isOpen ? <FiChevronUp /> : <FiChevronDown />}
            </IconButton>
          </HStack>
        </Flex>
      </Card.Header>

      <Collapsible.Root open={isOpen}>
        <Collapsible.Content style={{ overflow: 'visible' }}>
          <Card.Body pt={0} pb={4} px={4} overflow="visible">
            <VStack align="stretch" gap={3}>
              {/* Linha 1: Busca + Status */}
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">Buscar</Text>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Título do mangá..."
                    size="sm"
                    bg="gray.900"
                    borderColor="gray.700"
                    color="white"
                    _placeholder={{ color: 'gray.500' }}
                    _hover={{ borderColor: 'gray.600' }}
                    _focus={{ borderColor: 'blue.400' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">Status</Text>
                  <MultiSelect
                    placeholder="Selecionar status..."
                    selected={selectedStatus}
                    options={statusOptions}
                    onChange={setSelectedStatus}
                  />
                </Box>
              </Grid>

              {/* Linha 2: Tags */}
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">Gêneros / Tags</Text>
                <MultiSelect
                  placeholder="Buscar e adicionar tags..."
                  selected={selectedTags}
                  options={availableTags}
                  onChange={setSelectedTags}
                  getColor={getTagColor}
                />
              </Box>

              {/* Linha 3: Opções extras */}
              <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">
                    <Box as={FiStar} display="inline" mr={1} verticalAlign="middle" color="yellow.400" />
                    Nota mín.
                  </Text>
                  <NumberInput.Root
                    value={minRating}
                    onValueChange={(d) => setMinRating(d.value)}
                    min={0}
                    max={10}
                    step={0.5}
                    size="sm"
                  >
                    <NumberInput.Input
                      bg="gray.900"
                      borderColor="gray.700"
                      color="white"
                      placeholder="0-10"
                      _hover={{ borderColor: 'gray.600' }}
                      _focus={{ borderColor: 'yellow.400' }}
                    />
                  </NumberInput.Root>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">
                    <Box as={FiImage} display="inline" mr={1} verticalAlign="middle" color="green.400" />
                    Com capa
                  </Text>
                  <Flex
                    h="36px"
                    px={3}
                    bg="gray.900"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.700"
                    align="center"
                    justify="space-between"
                    cursor="pointer"
                    _hover={{ borderColor: 'gray.600' }}
                    onClick={() => setOnlyWithCovers(!onlyWithCovers)}
                  >
                    <Text color={onlyWithCovers ? 'green.300' : 'gray.500'} fontSize="xs">
                      {onlyWithCovers ? 'Sim' : 'Não'}
                    </Text>
                    <Switch.Root
                      checked={onlyWithCovers}
                      colorPalette="green"
                      size="sm"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </Flex>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">Ordenar por</Text>
                  <Select.Root
                    value={[sortBy]}
                    onValueChange={(e) => setSortBy(e.value[0])}
                    size="sm"
                    positioning={{ sameWidth: true }}
                    collection={sortByCollection}
                  >
                    <Select.Trigger bg="gray.900" borderColor="gray.700" color="white" h="36px" _hover={{ borderColor: 'gray.600' }}>
                      <Select.ValueText placeholder="Selecione" />
                    </Select.Trigger>
                    <Select.Positioner>
                      <Select.Content bg="gray.900" borderColor="gray.700">
                        {sortByItems.map((item) => (
                          <Select.Item key={item.value} item={item} color="white" _hover={{ bg: 'gray.700' }}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">Ordem</Text>
                  <Select.Root
                    value={[sortOrder]}
                    onValueChange={(e) => setSortOrder(e.value[0])}
                    size="sm"
                    positioning={{ sameWidth: true }}
                    collection={sortOrderCollection}
                  >
                    <Select.Trigger bg="gray.900" borderColor="gray.700" color="white" h="36px" _hover={{ borderColor: 'gray.600' }}>
                      <Select.ValueText placeholder="Ordem" />
                    </Select.Trigger>
                    <Select.Positioner>
                      <Select.Content bg="gray.900" borderColor="gray.700">
                        {sortOrderItems.map((item) => (
                          <Select.Item key={item.value} item={item} color="white" _hover={{ bg: 'gray.700' }}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
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
