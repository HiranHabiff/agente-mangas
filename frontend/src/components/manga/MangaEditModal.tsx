import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  VStack,
  HStack,
  Input,
  Text,
  Textarea,
  Image,
  Dialog,
  IconButton,
} from '@chakra-ui/react';
import { FiExternalLink, FiX } from 'react-icons/fi';
import { getImageUrl } from '../../config/api';
import { mangaApi } from '../../services/api';
import { MultiSelect, type MultiSelectOption } from '../ui/MultiSelect';
import { ChipInput } from '../ui/ChipInput';
import { StarRating } from '../ui/StarRating';
import type { Manga } from '../../types/manga';

interface MangaEditModalProps {
  manga: Manga;
  open: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
}

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

export function MangaEditModal({ manga, open, onClose, onSave }: MangaEditModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    primary_title: manga.primary_title || '',
    status: manga.status || 'reading',
    rating: manga.rating || 0,
    last_chapter_read: manga.last_chapter_read || 0,
    total_chapters: manga.total_chapters || 0,
    url: manga.url || '',
    synopsis: manga.synopsis || '',
    user_notes: manga.user_notes || '',
  });

  // Track tags separately for proper add/remove handling
  const [currentTags, setCurrentTags] = useState<string[]>((manga as any).tags || []);
  const [originalTags, setOriginalTags] = useState<string[]>((manga as any).tags || []);
  const [availableTags, setAvailableTags] = useState<MultiSelectOption[]>([]);

  // Track alternative names separately
  const [currentNames, setCurrentNames] = useState<string[]>(manga.alternative_names || []);
  const [originalNames, setOriginalNames] = useState<string[]>(manga.alternative_names || []);

  // Load available tags
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

  // Reset form data when manga changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        primary_title: manga.primary_title || '',
        status: manga.status || 'reading',
        rating: manga.rating || 0,
        last_chapter_read: manga.last_chapter_read || 0,
        total_chapters: manga.total_chapters || 0,
        url: manga.url || '',
        synopsis: manga.synopsis || '',
        user_notes: manga.user_notes || '',
      });
      const tags = (manga as any).tags || [];
      setCurrentTags([...tags]);
      setOriginalTags([...tags]);
      const names = manga.alternative_names || [];
      setCurrentNames([...names]);
      setOriginalNames([...names]);
    }
  }, [manga, open]);

  const goToDetails = () => {
    onClose();
    navigate(`/mangas/${manga.id}`);
  };

  const handleSave = () => {
    // Calculate which tags were added and removed
    const tagsToAdd = currentTags.filter(tag => !originalTags.includes(tag));
    const tagsToRemove = originalTags.filter(tag => !currentTags.includes(tag));

    // Calculate which names were added and removed
    const namesToAdd = currentNames.filter(name => !originalNames.includes(name));
    const namesToRemove = originalNames.filter(name => !currentNames.includes(name));

    const updates: any = {
      primary_title: formData.primary_title,
      status: formData.status,
      rating: Number(formData.rating),
      last_chapter_read: Number(formData.last_chapter_read),
      total_chapters: Number(formData.total_chapters),
      url: formData.url,
      synopsis: formData.synopsis,
      user_notes: formData.user_notes,
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

    onSave(updates);
  };

  const imageUrl = manga.image_filename ? getImageUrl(manga.image_filename) : null;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="xl" scrollBehavior="outside">
      <Dialog.Backdrop bg="blackAlpha.800" />
      <Dialog.Positioner>
        <Dialog.Content bg="gray.800" borderColor="gray.700" borderWidth="1px">
          {/* Header */}
          <Dialog.Header bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
            <HStack justify="space-between" w="100%">
              <Dialog.Title color="white" fontSize="xl" fontWeight="bold">
                Editar Mangá
              </Dialog.Title>
              <HStack gap={2}>
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  onClick={goToDetails}
                  leftIcon={<Box as={FiExternalLink} />}
                  color="purple.300"
                  borderColor="purple.500"
                  _hover={{ bg: 'purple.900', color: 'white' }}
                >
                  Ver Página
                </Button>
                <Dialog.CloseTrigger asChild>
                  <IconButton
                    aria-label="Fechar"
                    icon={<Box as={FiX} />}
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ bg: 'gray.700', color: 'white' }}
                  />
                </Dialog.CloseTrigger>
              </HStack>
            </HStack>
          </Dialog.Header>

          {/* Body */}
          <Dialog.Body p={6} overflow="visible">
            <HStack align="start" gap={6}>
            {/* Image Preview + Dates */}
            <VStack flexShrink={0} w="200px" gap={3}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={manga.primary_title}
                  w="100%"
                  h="300px"
                  objectFit="cover"
                  borderRadius="md"
                />
              ) : (
                <Box
                  w="100%"
                  h="300px"
                  bg="gray.700"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="gray.500">Sem capa</Text>
                </Box>
              )}

              {/* Date Info */}
              <VStack align="stretch" gap={1} w="100%">
                <Box bg="gray.700" p={2} borderRadius="md">
                  <Text fontSize="xs" color="gray.400">Criado em</Text>
                  <Text fontSize="sm" color="white">
                    {manga.created_at ? new Date(manga.created_at).toLocaleDateString('pt-BR') : '-'}
                  </Text>
                </Box>
                <Box bg="gray.700" p={2} borderRadius="md">
                  <Text fontSize="xs" color="gray.400">Atualizado em</Text>
                  <Text fontSize="sm" color="white">
                    {manga.updated_at ? new Date(manga.updated_at).toLocaleDateString('pt-BR') : '-'}
                  </Text>
                </Box>
                <Box bg="gray.700" p={2} borderRadius="md">
                  <Text fontSize="xs" color="gray.400">Última leitura</Text>
                  <Text fontSize="sm" color={manga.last_read_at ? 'green.300' : 'gray.500'}>
                    {manga.last_read_at ? new Date(manga.last_read_at).toLocaleDateString('pt-BR') : 'Nunca lido'}
                  </Text>
                </Box>
              </VStack>
            </VStack>

            {/* Form Fields */}
            <VStack flex={1} align="stretch" gap={4}>
              {/* Title */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                  Título Principal
                </Text>
                <Input
                  value={formData.primary_title}
                  onChange={(e) => setFormData({ ...formData, primary_title: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                />
              </Box>

              {/* Status and Rating */}
              <HStack gap={4}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                    Status
                  </Text>
                  <Box
                    as="select"
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    bg="gray.700"
                    borderColor="gray.600"
                    borderWidth="1px"
                    borderRadius="md"
                    p={2}
                    color="white"
                    w="100%"
                  >
                    <option value="reading">Lendo</option>
                    <option value="completed">Completo</option>
                    <option value="paused">Pausado</option>
                    <option value="dropped">Abandonado</option>
                    <option value="plan_to_read">Planejar</option>
                  </Box>
                </Box>

              </HStack>

              {/* Rating */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                  Nota
                </Text>
                <HStack gap={3} align="center">
                  <StarRating
                    value={Number(formData.rating) || 0}
                    onChange={(value) => setFormData({ ...formData, rating: value })}
                    max={10}
                    size="20px"
                    allowHalf
                  />
                  <Text color="gray.400" fontSize="sm" fontWeight="medium">
                    {Number(formData.rating || 0).toFixed(1)}
                  </Text>
                </HStack>
              </Box>

              {/* Chapters */}
              <HStack gap={4}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                    Último Capítulo Lido
                  </Text>
                  <Input
                    type="number"
                    min="0"
                    value={formData.last_chapter_read}
                    onChange={(e) => setFormData({ ...formData, last_chapter_read: Number(e.target.value) })}
                    bg="gray.700"
                    borderColor="gray.600"
                  />
                </Box>

                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                    Total de Capítulos
                  </Text>
                  <Input
                    type="number"
                    min="0"
                    value={formData.total_chapters}
                    onChange={(e) => setFormData({ ...formData, total_chapters: Number(e.target.value) })}
                    bg="gray.700"
                    borderColor="gray.600"
                  />
                </Box>
              </HStack>

              {/* URL */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                  URL
                </Text>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                  placeholder="https://..."
                />
              </Box>

              {/* Tags with MultiSelect */}
              <Box overflow="visible">
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
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

              {/* Alternative Names */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
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

              {/* Synopsis */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                  Sinopse
                </Text>
                <Textarea
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                  rows={4}
                />
              </Box>

              {/* User Notes */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                  Notas Pessoais
                </Text>
                <Textarea
                  value={formData.user_notes}
                  onChange={(e) => setFormData({ ...formData, user_notes: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                  rows={3}
                />
              </Box>
            </VStack>
          </HStack>
          </Dialog.Body>

          {/* Footer */}
          <Dialog.Footer borderTopWidth="1px" borderColor="gray.700">
            <HStack justify="flex-end" w="100%" gap={2}>
              <Button variant="outline" onClick={onClose} color="white">
                Cancelar
              </Button>
              <Button colorScheme="blue" onClick={handleSave}>
                Salvar Alterações
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
