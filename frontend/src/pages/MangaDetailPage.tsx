import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Image,
  HStack,
  VStack,
  Badge,
  Button,
  Grid,
  GridItem,
  Spinner,
  Center,
  Input,
  Textarea,
  Separator,
  Card,
  IconButton,
  Stack,
  Flex,
  Select,
  NumberInput,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiArrowLeft, FiStar, FiBookOpen, FiCalendar, FiTag, FiChevronLeft, FiChevronRight, FiMessageSquare, FiGitMerge, FiAlertTriangle } from 'react-icons/fi';
import { mangaApi, duplicatesApi } from '../services/api';
import { getImageUrl } from '../config/api';
import { MangaChatModal } from '../components/manga/MangaChatModal';
import { MultiSelect, type MultiSelectOption } from '../components/ui/MultiSelect';
import { ChipInput } from '../components/ui/ChipInput';
import { StarRating } from '../components/ui/StarRating';
import type { MangaComplete } from '../types/manga';

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

export function MangaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<MangaComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicates state
  const [duplicates, setDuplicates] = useState<MangaComplete[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(null);

  // Separate state for tags and alternative names
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [originalTags, setOriginalTags] = useState<string[]>([]);
  const [currentNames, setCurrentNames] = useState<string[]>([]);
  const [originalNames, setOriginalNames] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<MultiSelectOption[]>([]);

  useEffect(() => {
    if (id) {
      loadManga();
      loadDuplicates();
    }
    loadTags();
  }, [id]);

  const loadTags = async () => {
    try {
      const tags = await mangaApi.getTags();
      setAvailableTags(tags.map((t: any) => ({ value: t.name, label: t.name })));
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
    }
  };

  const loadDuplicates = async () => {
    if (!id) return;

    try {
      setLoadingDuplicates(true);
      const data = await duplicatesApi.list();

      // Find duplicate group that contains this manga
      const myGroup = data.groups.find(g =>
        g.group.some(m => m.id === id)
      );

      if (myGroup) {
        // Filter out the current manga from duplicates
        const otherDuplicates = myGroup.group.filter(m => m.id !== id);
        setDuplicates(otherDuplicates);
      } else {
        setDuplicates([]);
      }
    } catch (err) {
      console.error('Erro ao carregar duplicatas:', err);
      setDuplicates([]);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const handleMerge = async () => {
    if (!id || !selectedDuplicateId) return;

    try {
      setIsMerging(true);

      // Current manga is the target (keep), selected duplicate is the source (delete)
      await duplicatesApi.merge(id, [selectedDuplicateId]);

      // Reload data
      await loadManga(false);
      await loadDuplicates();

      setIsMergeDialogOpen(false);
      setSelectedDuplicateId(null);
    } catch (err) {
      console.error('Erro ao mesclar:', err);
      alert('Erro ao mesclar mangás');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDeleteDuplicate = async (duplicateId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta duplicata?')) return;

    try {
      await duplicatesApi.deleteMultiple([duplicateId], true);
      await loadDuplicates();
    } catch (err) {
      console.error('Erro ao excluir duplicata:', err);
      alert('Erro ao excluir duplicata');
    }
  };

  // Sincronizar editData quando entrar no modo de edição
  useEffect(() => {
    if (isEditing && manga) {
      setEditData({
        primary_title: manga.primary_title,
        synopsis: manga.synopsis || '',
        rating: manga.rating || '',
        status: manga.status || 'reading',
        last_chapter_read: manga.last_chapter_read || 0,
        total_chapters: manga.total_chapters || '',
        url: manga.url || '',
        user_notes: manga.user_notes || '',
      });

      // Copiar arrays de tags e nomes alternativos
      const tagsCopy = manga.tags ? [...manga.tags] : [];
      const namesCopy = manga.alternative_names ? [...manga.alternative_names] : [];

      setCurrentTags(tagsCopy);
      setOriginalTags(tagsCopy);
      setCurrentNames(namesCopy);
      setOriginalNames(namesCopy);
    }
  }, [isEditing, manga]);

  const loadManga = async (showLoading = true) => {
    if (!id) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const data = await mangaApi.getById(id);
      setManga(data);
    } catch (err) {
      console.error('Error loading manga:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mangá');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!id || !manga) return;

    try {
      // Calculate which tags were added and removed
      const tagsToAdd = currentTags.filter(tag => !originalTags.includes(tag));
      const tagsToRemove = originalTags.filter(tag => !currentTags.includes(tag));

      // Calculate which names were added and removed
      const namesToAdd = currentNames.filter(name => !originalNames.includes(name));
      const namesToRemove = originalNames.filter(name => !currentNames.includes(name));

      const updates: any = {
        primary_title: editData.primary_title,
        synopsis: editData.synopsis,
        url: editData.url,
        user_notes: editData.user_notes,
        status: editData.status,
        rating: editData.rating ? parseFloat(editData.rating) : undefined,
        last_chapter_read: editData.last_chapter_read ? parseInt(editData.last_chapter_read) : undefined,
        total_chapters: editData.total_chapters ? parseInt(editData.total_chapters) : undefined,
      };

      // Add names changes if any
      if (namesToAdd.length > 0) {
        updates.add_names = namesToAdd;
      }
      if (namesToRemove.length > 0) {
        updates.remove_names = namesToRemove;
      }

      // Add tags changes if any
      if (tagsToAdd.length > 0) {
        updates.add_tags = tagsToAdd;
      }
      if (tagsToRemove.length > 0) {
        updates.remove_tags = tagsToRemove;
      }

      await mangaApi.update(id, updates);
      setIsEditing(false);
      loadManga(false);
    } catch (err) {
      console.error('Error updating manga:', err);
      alert('Erro ao atualizar mangá');
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await mangaApi.delete(id, true); // permanent=true to also delete image file
      navigate('/mangas');
    } catch (err) {
      console.error('Error deleting manga:', err);
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleChapterUpdate = async (newChapter: number) => {
    if (!id) return;

    try {
      await mangaApi.trackChapter(id, newChapter);
      loadManga(false);
    } catch (err) {
      console.error('Error updating chapter:', err);
      alert('Erro ao atualizar capítulo');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      reading: 'green',
      completed: 'purple',
      paused: 'orange',
      dropped: 'red',
      plan_to_read: 'cyan',
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      reading: 'Lendo',
      completed: 'Completo',
      paused: 'Pausado',
      dropped: 'Abandonado',
      plan_to_read: 'Planos de Ler',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={3}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.400">Carregando mangá...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !manga) {
    return (
      <Center h="400px">
        <VStack gap={3}>
          <Text color="red.400" fontSize="lg">Erro ao carregar mangá</Text>
          <Text color="gray.400">{error}</Text>
          <Button onClick={() => navigate('/mangas')}>Voltar</Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box w="100%" minH="100vh" bg="gray.900">
      <Box maxW="1400px" mx="auto" p={{ base: 4, md: 8 }}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Button
              leftIcon={<Box as={FiArrowLeft} />}
              onClick={() => navigate('/mangas')}
              variant="ghost"
              colorScheme="gray"
              size="lg"
              color="white"
              _hover={{ bg: 'gray.800' }}
            >
              Voltar
            </Button>
            <HStack gap={3}>
              <Button
                leftIcon={<Box as={FiMessageSquare} />}
                onClick={() => setIsChatOpen(true)}
                colorScheme="purple"
                variant="solid"
                size="lg"
                color="white"
                bg="purple.600"
                _hover={{ bg: 'purple.700' }}
              >
                Chat AI
              </Button>
              <Button
                leftIcon={<Box as={FiEdit2} />}
                onClick={() => setIsEditing(!isEditing)}
                colorScheme={isEditing ? 'red' : 'blue'}
                variant={isEditing ? 'outline' : 'solid'}
                size="lg"
                color={isEditing ? 'red.300' : 'white'}
                bg={isEditing ? 'transparent' : 'blue.600'}
                borderColor={isEditing ? 'red.500' : 'blue.600'}
                _hover={{ 
                  bg: isEditing ? 'red.900' : 'blue.700',
                  color: 'white'
                }}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
              <IconButton
                aria-label="Excluir mangá"
                icon={<Box as={FiTrash2} />}
                onClick={() => setIsDeleteDialogOpen(true)}
                colorScheme="red"
                variant="outline"
                size="lg"
                color="red.400"
                borderColor="red.500"
                _hover={{ bg: 'red.900', color: 'white' }}
              />
            </HStack>
          </Flex>

        {/* Main Content */}
        <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={8}>
          {/* Cover Image and Quick Actions */}
          <GridItem>
            <VStack gap={6} align="stretch" position={{ lg: 'sticky' }} top="20px">
              {/* Cover Card */}
              <Card.Root overflow="hidden" bg="gray.800" borderColor="gray.700" shadow="2xl">
                <Card.Body p={0}>
                  {manga.image_filename ? (
                    <Image
                      src={getImageUrl(manga.image_filename)}
                      alt={manga.primary_title}
                      w="100%"
                      h="auto"
                      maxH="600px"
                      objectFit="cover"
                      loading="lazy"
                      fallback={
                        <Center h="500px" bg="gray.700">
                          <Spinner size="xl" color="blue.500" />
                        </Center>
                      }
                    />
                  ) : (
                    <Center h="500px" bg="gray.700">
                      <VStack gap={3}>
                        <Box as={FiBookOpen} fontSize="48px" color="gray.500" />
                        <Text color="gray.500" fontSize="lg">Sem capa</Text>
                      </VStack>
                    </Center>
                  )}
                </Card.Body>
              </Card.Root>

              {/* Quick Actions Card */}
              <Card.Root bg="gray.800" borderColor="gray.700">
                <Card.Body>
                  <VStack gap={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="sm" color="blue.400">Capítulo Atual</Heading>
                      <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                        {manga.last_chapter_read || 0} / {manga.total_chapters || '?'}
                      </Badge>
                    </HStack>
                    
                    {/* Chapter Number Input */}
                    <NumberInput.Root
                      value={String(manga.last_chapter_read || 0)}
                      onValueChange={(details) => {
                        const newValue = parseInt(details.value);
                        if (!isNaN(newValue) && newValue >= 0) {
                          handleChapterUpdate(newValue);
                        }
                      }}
                      min={0}
                      max={manga.total_chapters || undefined}
                      size="lg"
                    >
                      <HStack gap={0}>
                        <NumberInput.DecrementTrigger
                          bg="gray.700"
                          color="gray.300"
                          borderColor="gray.600"
                          _hover={{ bg: 'gray.600', color: 'white' }}
                          fontSize="2xl"
                          fontWeight="bold"
                          h="60px"
                          px={6}
                          borderRadius="md"
                          borderRightRadius={0}
                        >
                          −
                        </NumberInput.DecrementTrigger>
                        
                        <NumberInput.Input
                          bg="gray.800"
                          color="white"
                          borderColor="gray.600"
                          textAlign="center"
                          fontSize="2xl"
                          fontWeight="bold"
                          h="60px"
                          borderRadius={0}
                          borderLeft="none"
                          borderRight="none"
                          _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                        />
                        
                        <NumberInput.IncrementTrigger
                          bg="gray.700"
                          color="gray.300"
                          borderColor="gray.600"
                          _hover={{ bg: 'gray.600', color: 'white' }}
                          fontSize="2xl"
                          fontWeight="bold"
                          h="60px"
                          px={6}
                          borderRadius="md"
                          borderLeftRadius={0}
                        >
                          +
                        </NumberInput.IncrementTrigger>
                      </HStack>
                    </NumberInput.Root>

                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      Use os botões ou digite o capítulo
                    </Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </VStack>
          </GridItem>

          {/* Details Section */}
          <GridItem>
            <VStack align="stretch" gap={6}>
              {/* View Mode Cards */}
              {!isEditing && (
                <>
                  {/* Title Card */}
                  <Card.Root bg="gray.800" borderColor="gray.700">
                    <Card.Body>
                      <VStack align="stretch" gap={4}>
                        {/* Title */}
                        <Heading size="2xl" color="white" lineHeight="1.2">
                          {manga.primary_title}
                        </Heading>

                        {/* Status and Rating Badges */}
                        <Flex flexWrap="wrap" gap={3}>
                          <Badge
                            colorScheme={getStatusColor(manga.status)}
                            fontSize="md"
                            px={4}
                            py={2}
                            borderRadius="full"
                            fontWeight="semibold"
                          >
                            {getStatusLabel(manga.status)}
                          </Badge>
                          {manga.rating && (
                            <Badge
                              colorScheme="yellow"
                              fontSize="md"
                              px={4}
                              py={2}
                              borderRadius="full"
                              fontWeight="semibold"
                            >
                              <HStack gap={1}>
                                <Box as={FiStar} />
                                <span>{Number(manga.rating).toFixed(1)}</span>
                              </HStack>
                            </Badge>
                          )}
                          <Badge
                            colorScheme="blue"
                            fontSize="md"
                            px={4}
                            py={2}
                            borderRadius="full"
                            fontWeight="semibold"
                          >
                            {manga.last_chapter_read || 0} / {manga.total_chapters || '?'} caps
                          </Badge>
                        </Flex>

                        {/* Alternative Names */}
                        {manga.alternative_names && manga.alternative_names.length > 0 && (
                          <Box>
                            <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={2} textTransform="uppercase">
                              Nomes Alternativos
                            </Text>
                            <Text color="gray.300" fontSize="sm" lineHeight="1.6">
                              {manga.alternative_names.join(' • ')}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Synopsis Card */}
                  <Card.Root bg="gray.800" borderColor="gray.700">
                    <Card.Body>
                      <VStack align="stretch" gap={4}>
                        <Heading size="md" color="blue.400">Sinopse</Heading>
                        <Box>
                          {manga.synopsis ? (
                            <Text
                              color="gray.200"
                              whiteSpace="pre-wrap"
                              fontSize="md"
                              lineHeight="1.8"
                            >
                              {manga.synopsis}
                            </Text>
                          ) : (
                            <Text color="gray.500" fontStyle="italic" fontSize="md">
                              Nenhuma sinopse disponível
                            </Text>
                          )}
                        </Box>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Tags Card */}
                  {manga.tags && manga.tags.length > 0 && (
                    <Card.Root bg="gray.800" borderColor="gray.700">
                      <Card.Body>
                        <VStack align="stretch" gap={4}>
                          <HStack>
                            <Box as={FiTag} color="purple.400" fontSize="20px" />
                            <Heading size="md" color="purple.400">Tags</Heading>
                          </HStack>
                          <Flex flexWrap="wrap" gap={3}>
                            {manga.tags.map((tag) => (
                              <Badge
                                key={tag}
                                colorScheme="purple"
                                fontSize="sm"
                                px={4}
                                py={2}
                                borderRadius="full"
                                fontWeight="medium"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </Flex>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  )}

                  {/* User Notes Card */}
                  {manga.user_notes && (
                    <Card.Root bg="gray.800" borderColor="gray.700">
                      <Card.Body>
                        <VStack align="stretch" gap={4}>
                          <Heading size="md" color="orange.400">Minhas Notas</Heading>
                          <Text
                            color="gray.200"
                            whiteSpace="pre-wrap"
                            fontSize="md"
                            lineHeight="1.8"
                          >
                            {manga.user_notes}
                          </Text>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  )}
                </>
              )}

              {/* Edit Form Card */}
              {isEditing && (
                <Card.Root bg="gray.800" borderColor="blue.700" borderWidth="2px">
                  <Card.Body>
                    <VStack align="stretch" gap={6}>
                      <Heading size="md" color="blue.400">Editar Informações</Heading>
                      
                      {/* Título */}
                      <Box>
                        <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                          Título Principal
                        </Text>
                        <Input
                          value={editData.primary_title}
                          onChange={(e) => setEditData({ ...editData, primary_title: e.target.value })}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          size="lg"
                          _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                        />
                      </Box>

                      {/* Nomes Alternativos */}
                      <Box>
                        <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                          Nomes Alternativos
                        </Text>
                        <ChipInput
                          placeholder="Digite um nome e pressione Enter..."
                          values={currentNames}
                          onChange={setCurrentNames}
                          colorScheme="cyan"
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Pressione Enter para adicionar
                        </Text>
                      </Box>

                      {/* Sinopse */}
                      <Box>
                        <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                          Sinopse
                        </Text>
                        <Textarea
                          value={editData.synopsis}
                          onChange={(e) => setEditData({ ...editData, synopsis: e.target.value })}
                          rows={6}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          fontSize="md"
                          lineHeight="1.7"
                          placeholder="Sinopse do mangá..."
                          _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                        />
                      </Box>

                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                        <Box>
                          <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                            Status
                          </Text>
                          <Select.Root
                            value={[editData.status]}
                            onValueChange={(e) => setEditData({ ...editData, status: e.value[0] })}
                            size="lg"
                          >
                            <Select.Trigger bg="gray.700" borderColor="gray.600" color="white">
                              <Select.ValueText placeholder="Selecione o status" />
                            </Select.Trigger>
                            <Portal>
                              <Select.Positioner>
                                <Select.Content bg="gray.700" borderColor="gray.600">
                                  <Select.Item item="reading" color="white">Lendo</Select.Item>
                                  <Select.Item item="completed" color="white">Completo</Select.Item>
                                  <Select.Item item="paused" color="white">Pausado</Select.Item>
                                  <Select.Item item="dropped" color="white">Abandonado</Select.Item>
                                  <Select.Item item="plan_to_read" color="white">Planos de Ler</Select.Item>
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                            Nota
                          </Text>
                          <HStack gap={3} align="center">
                            <StarRating
                              value={Number(editData.rating) || 0}
                              onChange={(value) => setEditData({ ...editData, rating: String(value) })}
                              max={10}
                              size="22px"
                              allowHalf
                            />
                            <Text color="gray.400" fontSize="sm" fontWeight="medium">
                              {Number(editData.rating || 0).toFixed(1)}
                            </Text>
                          </HStack>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                            Último Capítulo Lido
                          </Text>
                          <Input
                            type="number"
                            min="0"
                            value={editData.last_chapter_read}
                            onChange={(e) => setEditData({ ...editData, last_chapter_read: e.target.value })}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            size="lg"
                            _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                          />
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                            Total de Capítulos
                          </Text>
                          <Input
                            type="number"
                            min="0"
                            value={editData.total_chapters}
                            onChange={(e) => setEditData({ ...editData, total_chapters: e.target.value })}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            size="lg"
                            _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                          />
                        </Box>
                      </Grid>

                      {/* Tags */}
                      <Box overflow="visible">
                        <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                          Tags
                        </Text>
                        <MultiSelect
                          placeholder="Buscar ou criar tags..."
                          selected={currentTags}
                          options={availableTags}
                          onChange={setCurrentTags}
                          getColor={getTagColor}
                          allowCreate={true}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Digite para buscar ou criar novas tags
                        </Text>
                      </Box>

                      {/* URL */}
                      <Box>
                        <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                          URL do Mangá
                        </Text>
                        <Input
                          value={editData.url}
                          onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          size="lg"
                          placeholder="https://..."
                          _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                        />
                      </Box>

                      <Box>
                        <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                          Notas Pessoais
                        </Text>
                        <Textarea
                          value={editData.user_notes}
                          onChange={(e) => setEditData({ ...editData, user_notes: e.target.value })}
                          rows={5}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          fontSize="md"
                          placeholder="Suas anotações sobre este mangá..."
                          _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                        />
                      </Box>

                      <Button 
                        onClick={handleUpdate} 
                        colorScheme="green" 
                        size="lg"
                        h="60px"
                        fontSize="lg"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                        transition="all 0.2s"
                      >
                        💾 Salvar Alterações
                      </Button>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Metadata Card (always visible) */}
              <Card.Root bg="gray.800" borderColor="gray.700">
                <Card.Body>
                  <VStack align="stretch" gap={4}>
                    <HStack>
                      <Box as={FiCalendar} color="gray.400" fontSize="20px" />
                      <Heading size="sm" color="gray.300">Informações</Heading>
                    </HStack>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                      {manga.created_at && (
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={2} textTransform="uppercase">
                            Adicionado em
                          </Text>
                          <Text color="gray.200" fontSize="sm" fontWeight="medium">
                            {new Date(manga.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </Text>
                        </Box>
                      )}
                      {manga.updated_at && (
                        <Box>
                          <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={2} textTransform="uppercase">
                            Última atualização
                          </Text>
                          <Text color="gray.200" fontSize="sm" fontWeight="medium">
                            {new Date(manga.updated_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </Box>
                      )}
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={2} textTransform="uppercase">
                          Última leitura
                        </Text>
                        <Text color={manga.last_read_at ? 'green.300' : 'gray.500'} fontSize="sm" fontWeight="medium">
                          {manga.last_read_at
                            ? new Date(manga.last_read_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Nunca lido'}
                        </Text>
                      </Box>
                    </Grid>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Duplicates Card */}
              {!isEditing && duplicates.length > 0 && (
                <Card.Root bg="gray.800" borderColor="orange.600" borderWidth="2px">
                  <Card.Body>
                    <VStack align="stretch" gap={4}>
                      <HStack justify="space-between">
                        <HStack>
                          <Box as={FiAlertTriangle} color="orange.400" fontSize="20px" />
                          <Heading size="sm" color="orange.400">
                            Possíveis Duplicatas ({duplicates.length})
                          </Heading>
                        </HStack>
                        <Button
                          as="a"
                          href="/duplicates"
                          size="xs"
                          variant="ghost"
                          color="orange.300"
                          _hover={{ bg: 'orange.900' }}
                        >
                          Ver Todos
                        </Button>
                      </HStack>

                      <Text color="gray.400" fontSize="sm">
                        Foram encontrados mangás com nomes similares. Você pode mesclar os dados ou excluir as duplicatas.
                      </Text>

                      <VStack align="stretch" gap={3}>
                        {duplicates.map((dup) => (
                          <Box
                            key={dup.id}
                            p={3}
                            bg="gray.700"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.600"
                          >
                            <Flex justify="space-between" align="start" gap={3}>
                              <HStack gap={3} flex={1}>
                                {dup.image_filename ? (
                                  <Image
                                    src={getImageUrl(dup.image_filename)}
                                    alt={dup.primary_title}
                                    w="50px"
                                    h="70px"
                                    objectFit="cover"
                                    borderRadius="sm"
                                  />
                                ) : (
                                  <Center w="50px" h="70px" bg="gray.600" borderRadius="sm">
                                    <Text color="gray.500" fontSize="xs">N/A</Text>
                                  </Center>
                                )}
                                <VStack align="start" gap={1} flex={1}>
                                  <Text color="white" fontWeight="semibold" fontSize="sm" lineClamp={1}>
                                    {dup.primary_title}
                                  </Text>
                                  <HStack gap={2} flexWrap="wrap">
                                    <Badge colorScheme={getStatusColor(dup.status)} fontSize="xs">
                                      {getStatusLabel(dup.status)}
                                    </Badge>
                                    <Badge
                                      colorScheme={(dup.last_chapter_read || 0) > 0 ? 'blue' : 'gray'}
                                      fontSize="xs"
                                    >
                                      Cap. {dup.last_chapter_read || 0}
                                    </Badge>
                                    {dup.rating && (
                                      <Badge colorScheme="yellow" fontSize="xs">
                                        ★ {Number(dup.rating).toFixed(1)}
                                      </Badge>
                                    )}
                                  </HStack>
                                  {dup.alternative_names && dup.alternative_names.length > 0 && (
                                    <Text color="gray.500" fontSize="xs" lineClamp={1}>
                                      {dup.alternative_names.slice(0, 2).join(', ')}
                                      {dup.alternative_names.length > 2 && ` +${dup.alternative_names.length - 2}`}
                                    </Text>
                                  )}
                                </VStack>
                              </HStack>

                              <HStack gap={2}>
                                <Button
                                  size="xs"
                                  colorScheme="purple"
                                  leftIcon={<Box as={FiGitMerge} />}
                                  onClick={() => {
                                    setSelectedDuplicateId(dup.id);
                                    setIsMergeDialogOpen(true);
                                  }}
                                >
                                  Mesclar
                                </Button>
                                <IconButton
                                  aria-label="Excluir duplicata"
                                  icon={<Box as={FiTrash2} />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteDuplicate(dup.id)}
                                />
                              </HStack>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}
            </VStack>
          </GridItem>
        </Grid>
      </VStack>
    </Box>

    {/* Chat AI Modal */}
    {manga && (
      <MangaChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        manga={manga}
      />
    )}

    {/* Delete Confirmation Dialog */}
    <Dialog.Root
      open={isDeleteDialogOpen}
      onOpenChange={(e) => !e.open && setIsDeleteDialogOpen(false)}
      role="alertdialog"
    >
      <Dialog.Backdrop bg="blackAlpha.800" />
      <Dialog.Positioner>
        <Dialog.Content bg="gray.800" borderColor="red.600" borderWidth="2px" maxW="450px">
          <Dialog.Header bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
            <HStack gap={3}>
              <Box
                p={2}
                bg="red.900"
                borderRadius="full"
              >
                <Box as={FiTrash2} color="red.400" fontSize="20px" />
              </Box>
              <Dialog.Title color="white" fontSize="xl" fontWeight="bold">
                Excluir Mangá
              </Dialog.Title>
            </HStack>
          </Dialog.Header>

          <Dialog.Body py={6}>
            <VStack align="stretch" gap={4}>
              <Text color="gray.200" fontSize="md">
                Tem certeza que deseja excluir <Text as="span" fontWeight="bold" color="white">"{manga?.primary_title}"</Text>?
              </Text>
              <Box bg="red.900" p={4} borderRadius="md" borderWidth="1px" borderColor="red.700">
                <Text color="red.200" fontSize="sm">
                  ⚠️ Esta ação não pode ser desfeita. Todos os dados do mangá, incluindo progresso de leitura, tags e notas serão perdidos permanentemente.
                </Text>
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer borderTopWidth="1px" borderColor="gray.700">
            <HStack justify="flex-end" w="100%" gap={3}>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                color="gray.300"
                borderColor="gray.600"
                _hover={{ bg: 'gray.700', color: 'white' }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                bg="red.600"
                _hover={{ bg: 'red.700' }}
                loading={isDeleting}
                loadingText="Excluindo..."
              >
                Excluir Mangá
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>

    {/* Merge Confirmation Dialog */}
    <Dialog.Root
      open={isMergeDialogOpen}
      onOpenChange={(e) => !e.open && setIsMergeDialogOpen(false)}
      role="alertdialog"
    >
      <Dialog.Backdrop bg="blackAlpha.800" />
      <Dialog.Positioner>
        <Dialog.Content bg="gray.800" borderColor="purple.600" borderWidth="2px" maxW="500px">
          <Dialog.Header bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
            <HStack gap={3}>
              <Box
                p={2}
                bg="purple.900"
                borderRadius="full"
              >
                <Box as={FiGitMerge} color="purple.400" fontSize="20px" />
              </Box>
              <Dialog.Title color="white" fontSize="xl" fontWeight="bold">
                Mesclar Mangás
              </Dialog.Title>
            </HStack>
          </Dialog.Header>

          <Dialog.Body py={6}>
            <VStack align="stretch" gap={4}>
              <Text color="gray.200" fontSize="md">
                Os dados do mangá duplicado serão mesclados com <Text as="span" fontWeight="bold" color="white">"{manga?.primary_title}"</Text>.
              </Text>

              {selectedDuplicateId && duplicates.find(d => d.id === selectedDuplicateId) && (
                <Box bg="gray.700" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.600">
                  <Text color="gray.400" fontSize="xs" mb={2} textTransform="uppercase">
                    Será excluído:
                  </Text>
                  <HStack gap={3}>
                    {duplicates.find(d => d.id === selectedDuplicateId)?.image_filename ? (
                      <Image
                        src={getImageUrl(duplicates.find(d => d.id === selectedDuplicateId)!.image_filename!)}
                        alt=""
                        w="40px"
                        h="60px"
                        objectFit="cover"
                        borderRadius="sm"
                      />
                    ) : (
                      <Center w="40px" h="60px" bg="gray.600" borderRadius="sm">
                        <Text color="gray.500" fontSize="xs">N/A</Text>
                      </Center>
                    )}
                    <VStack align="start" gap={1}>
                      <Text color="white" fontWeight="semibold" fontSize="sm">
                        {duplicates.find(d => d.id === selectedDuplicateId)?.primary_title}
                      </Text>
                      <HStack gap={2}>
                        <Badge colorScheme="blue" fontSize="xs">
                          Cap. {duplicates.find(d => d.id === selectedDuplicateId)?.last_chapter_read || 0}
                        </Badge>
                        {duplicates.find(d => d.id === selectedDuplicateId)?.rating && (
                          <Badge colorScheme="yellow" fontSize="xs">
                            ★ {Number(duplicates.find(d => d.id === selectedDuplicateId)?.rating).toFixed(1)}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              )}

              <Box bg="purple.900" p={4} borderRadius="md" borderWidth="1px" borderColor="purple.700">
                <Text color="purple.200" fontSize="sm">
                  ✨ Os seguintes dados serão combinados: tags, nomes alternativos, maior capítulo lido, maior nota, sinopse mais completa.
                </Text>
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer borderTopWidth="1px" borderColor="gray.700">
            <HStack justify="flex-end" w="100%" gap={3}>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMergeDialogOpen(false);
                  setSelectedDuplicateId(null);
                }}
                color="gray.300"
                borderColor="gray.600"
                _hover={{ bg: 'gray.700', color: 'white' }}
                disabled={isMerging}
              >
                Cancelar
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleMerge}
                bg="purple.600"
                _hover={{ bg: 'purple.700' }}
                loading={isMerging}
                loadingText="Mesclando..."
              >
                Confirmar Mesclagem
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  </Box>
  );
}
