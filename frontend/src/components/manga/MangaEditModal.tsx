import { useState } from 'react';
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
import type { Manga } from '../../types/manga';

interface MangaEditModalProps {
  manga: Manga;
  open: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
}

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
    alternative_names: manga.alternative_names?.join('\n') || '',
    tags: (manga as any).tags?.join(', ') || '',
  });

  const goToDetails = () => {
    onClose();
    navigate(`/mangas/${manga.id}`);
  };

  const handleSave = () => {
    const updates = {
      ...formData,
      rating: Number(formData.rating),
      last_chapter_read: Number(formData.last_chapter_read),
      total_chapters: Number(formData.total_chapters),
      alternative_names: formData.alternative_names
        .split('\n')
        .filter(name => name.trim())
        .map(name => name.trim()),
      add_tags: formData.tags
        .split(',')
        .filter(tag => tag.trim())
        .map(tag => tag.trim()),
    };
    onSave(updates);
  };

  const imageUrl = manga.image_filename ? getImageUrl(manga.image_filename) : null;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="lg" scrollBehavior="outside">
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
          <Dialog.Body p={6}>
            <HStack align="start" gap={6}>
            {/* Image Preview */}
            <Box flexShrink={0} w="200px">
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
            </Box>

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

                <Box w="120px">
                  <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                    Rating (0-10)
                  </Text>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    bg="gray.700"
                    borderColor="gray.600"
                  />
                </Box>
              </HStack>

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

              {/* Tags */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                  Tags (separadas por vírgula)
                </Text>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                  placeholder="Ação, Aventura, Shounen"
                  color="white"
                />
              </Box>

              {/* Alternative Names */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={1} color="white">
                  Nomes Alternativos (um por linha)
                </Text>
                <Textarea
                  value={formData.alternative_names}
                  onChange={(e) => setFormData({ ...formData, alternative_names: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                  rows={3}
                  placeholder="Nome alternativo 1&#10;Nome alternativo 2"
                />
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
