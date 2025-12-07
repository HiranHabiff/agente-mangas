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
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiArrowLeft, FiStar, FiBookOpen, FiCalendar, FiTag, FiChevronLeft, FiChevronRight, FiMessageSquare } from 'react-icons/fi';
import { mangaApi } from '../services/api';
import { getImageUrl } from '../config/api';
import { MangaChatModal } from '../components/manga/MangaChatModal';
import type { MangaComplete } from '../types/manga';

export function MangaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<MangaComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadManga();
    }
  }, [id]);

  // Sincronizar editData quando entrar no modo de edição
  useEffect(() => {
    if (isEditing && manga) {
      setEditData({
        primary_title: manga.primary_title,
        alternative_names: manga.alternative_names?.join(', ') || '',
        synopsis: manga.synopsis || '',
        rating: manga.rating || '',
        status: manga.status || 'reading',
        total_chapters: manga.total_chapters || '',
        tags: manga.tags?.join(', ') || '',
        url: manga.url || '',
        user_notes: manga.user_notes || '',
      });
    }
  }, [isEditing, manga]);

  const loadManga = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await mangaApi.getById(id);
      console.log('Manga loaded:', data);
      setManga(data);
      setEditData({
        primary_title: data.primary_title,
        alternative_names: data.alternative_names?.join(', ') || '',
        synopsis: data.synopsis || '',
        rating: data.rating || '',
        status: data.status || 'reading',
        total_chapters: data.total_chapters || '',
        tags: data.tags?.join(', ') || '',
        url: data.url || '',
        user_notes: data.user_notes || '',
      });
    } catch (err) {
      console.error('Error loading manga:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mangá');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !manga) return;

    try {
      const updates: any = {
        primary_title: editData.primary_title,
        synopsis: editData.synopsis,
        url: editData.url,
        user_notes: editData.user_notes,
        status: editData.status,
        rating: editData.rating ? parseFloat(editData.rating) : undefined,
        total_chapters: editData.total_chapters ? parseInt(editData.total_chapters) : undefined,
      };

      // Processar nomes alternativos (add_names)
      if (editData.alternative_names) {
        const newNames = editData.alternative_names
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        const currentNames = manga?.alternative_names || [];
        
        // Adicionar nomes novos
        const namesToAdd = newNames.filter(n => !currentNames.includes(n));
        if (namesToAdd.length > 0) {
          updates.add_names = namesToAdd;
        }
        
        // Remover nomes que não estão mais na lista
        const namesToRemove = currentNames.filter(n => !newNames.includes(n));
        if (namesToRemove.length > 0) {
          updates.remove_names = namesToRemove;
        }
      }

      // Processar tags (add_tags)
      if (editData.tags) {
        const newTags = editData.tags
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        const currentTags = manga?.tags || [];
        
        // Adicionar tags novas
        const tagsToAdd = newTags.filter(t => !currentTags.includes(t));
        if (tagsToAdd.length > 0) {
          updates.add_tags = tagsToAdd;
        }
        
        // Remover tags que não estão mais na lista
        const tagsToRemove = currentTags.filter(t => !newTags.includes(t));
        if (tagsToRemove.length > 0) {
          updates.remove_tags = tagsToRemove;
        }
      }

      await mangaApi.update(id, updates);
      setIsEditing(false);
      loadManga();
    } catch (err) {
      console.error('Error updating manga:', err);
      alert('Erro ao atualizar mangá');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Tem certeza que deseja excluir este mangá?')) return;

    try {
      await mangaApi.delete(id);
      navigate('/mangas');
    } catch (err) {
      console.error('Error deleting manga:', err);
      alert('Erro ao excluir mangá');
    }
  };

  const handleChapterUpdate = async (newChapter: number) => {
    if (!id) return;

    try {
      await mangaApi.trackChapter(id, newChapter);
      loadManga();
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
                onClick={handleDelete}
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
              {/* Title Card */}
              <Card.Root bg="gray.800" borderColor="gray.700">
                <Card.Body>
                  <VStack align="stretch" gap={4}>
                    {/* Title */}
                    {isEditing ? (
                      <Input
                        value={editData.primary_title}
                        onChange={(e) => setEditData({ ...editData, primary_title: e.target.value })}
                        size="lg"
                        fontWeight="bold"
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        fontSize="2xl"
                        _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                      />
                    ) : (
                      <Heading size="2xl" color="white" lineHeight="1.2">
                        {manga.primary_title}
                      </Heading>
                    )}

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
                            <span>{manga.rating.toFixed(1)}</span>
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
                    {isEditing ? (
                      <Textarea
                        value={editData.synopsis}
                        onChange={(e) => setEditData({ ...editData, synopsis: e.target.value })}
                        rows={8}
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        fontSize="md"
                        lineHeight="1.7"
                        _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                      />
                    ) : (
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
                    )}
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
                        <Input
                          value={editData.alternative_names}
                          onChange={(e) => setEditData({ ...editData, alternative_names: e.target.value })}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          size="lg"
                          placeholder="Separe por vírgula: Nome 1, Nome 2, Nome 3"
                          _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                        />
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
                            <Select.Content bg="gray.700" borderColor="gray.600">
                              <Select.Item item="reading" color="white">Lendo</Select.Item>
                              <Select.Item item="completed" color="white">Completo</Select.Item>
                              <Select.Item item="paused" color="white">Pausado</Select.Item>
                              <Select.Item item="dropped" color="white">Abandonado</Select.Item>
                              <Select.Item item="plan_to_read" color="white">Planos de Ler</Select.Item>
                            </Select.Content>
                          </Select.Root>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                            Nota (0-10)
                          </Text>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={editData.rating}
                            onChange={(e) => setEditData({ ...editData, rating: e.target.value })}
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
                      <Box>
                        <Text fontSize="sm" color="gray.300" mb={2} fontWeight="semibold">
                          Tags
                        </Text>
                        <Input
                          value={editData.tags}
                          onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          size="lg"
                          placeholder="Separe por vírgula: Ação, Aventura, Fantasia"
                          _focus={{ borderColor: 'blue.500', shadow: 'md' }}
                        />
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

              {/* User Notes Card (view mode) */}
              {!isEditing && manga.user_notes && (
                <Card.Root bg="gray.800" borderColor="gray.700">
                  <Card.Body>
                    <VStack align="stretch" gap={4}>
                      <Heading size="md" color="orange.400">📝 Minhas Notas</Heading>
                      <Text 
                        color="gray.200" 
                        whiteSpace="pre-wrap" 
                        fontSize="md" 
                        lineHeight="1.8"
                        p={4}
                        bg="gray.700"
                        borderRadius="md"
                        borderLeft="4px solid"
                        borderLeftColor="orange.500"
                      >
                        {manga.user_notes}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Metadata Card */}
              <Card.Root bg="gray.800" borderColor="gray.700">
                <Card.Body>
                  <VStack align="stretch" gap={4}>
                    <HStack>
                      <Box as={FiCalendar} color="gray.400" fontSize="20px" />
                      <Heading size="sm" color="gray.300">Informações</Heading>
                    </HStack>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
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
                    </Grid>
                  </VStack>
                </Card.Body>
              </Card.Root>
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
  </Box>
  );
}
