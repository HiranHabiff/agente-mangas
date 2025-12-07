import { useState } from 'react';
import { Box, Text, Image, VStack, HStack, Badge } from '@chakra-ui/react';
import { getImageUrl } from '../../config/api';
import { MangaEditModal } from './MangaEditModal';
import { mangaApi } from '../../services/api';
import type { Manga } from '../../types/manga';

interface MangaCardProps {
  manga: Manga;
  onUpdate?: () => void;
}

const statusColors: Record<string, string> = {
  reading: 'green',
  completed: 'purple',
  paused: 'orange',
  dropped: 'red',
  plan_to_read: 'cyan',
};

const statusLabels: Record<string, string> = {
  reading: 'Lendo',
  completed: 'Completo',
  paused: 'Pausado',
  dropped: 'Abandonado',
  plan_to_read: 'Planejar',
};

export function MangaCard({ manga, onUpdate }: MangaCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!manga) {
    return null;
  }

  const imageUrl = manga.image_filename ? getImageUrl(manga.image_filename) : null;
  const progress = manga.total_chapters && manga.total_chapters > 0
    ? (manga.last_chapter_read / manga.total_chapters) * 100
    : 0;

  const handleSave = async (updates: any) => {
    try {
      await mangaApi.update(manga.id, updates);
      setModalOpen(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao atualizar mangá:', error);
      alert('Erro ao salvar alterações');
    }
  };

  return (
    <>
      <Box
        borderWidth="1px"
        borderColor="gray.700"
        borderRadius="lg"
        overflow="hidden"
        bg="gray.800"
        _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
        transition="all 0.2s"
        cursor="pointer"
        onClick={() => setModalOpen(true)}
      >
      {/* Image */}
      <Box position="relative" height="450px" bg="gray.700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={manga.primary_title || 'Manga cover'}
            width="100%"
            height="100%"
            objectFit="cover"
            fallback={
              <Box
                width="100%"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.700"
              >
                <Text color="gray.500" fontSize="sm">Sem capa</Text>
              </Box>
            }
          />
        ) : (
          <Box
            width="100%"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="gray.700"
          >
            <Text color="gray.500" fontSize="sm">Sem capa</Text>
          </Box>
        )}
        {manga.status && (
          <Badge
            position="absolute"
            top={2}
            left={2}
            colorScheme={statusColors[manga.status] || 'gray'}
            fontSize="xs"
          >
            {statusLabels[manga.status] || manga.status}
          </Badge>
        )}
      </Box>

      {/* Content */}
      <VStack align="stretch" p={4} gap={3}>
        {/* Primary Title */}
        <Text
          fontWeight="bold"
          fontSize="md"
          color="white"
          noOfLines={2}
          minHeight="40px"
          title={manga.primary_title}
        >
          {manga.primary_title || 'Sem título'}
        </Text>


        {/* Progress Info */}
        <VStack align="stretch" gap={1}>
          {/* Last Chapter Read */}
          {manga.last_chapter_read !== undefined && manga.last_chapter_read !== null && (
            <Text fontSize="sm" color="blue.400" fontWeight="semibold">
              Último capítulo: {manga.last_chapter_read}
            </Text>
          )}
          
          {/* Progress Bar */}
          {manga.total_chapters && manga.total_chapters > 0 && (
            <Box>
              <Box
                height="6px"
                bg="gray.700"
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  height="100%"
                  width={`${progress}%`}
                  bg={progress === 100 ? 'green.500' : 'blue.500'}
                  transition="width 0.3s"
                />
              </Box>
              <Text fontSize="xs" color="gray.400" mt={1}>
                {manga.last_chapter_read} / {manga.total_chapters} capítulos ({progress.toFixed(0)}%)
              </Text>
            </Box>
          )}
        </VStack>

        {/* Alternative Names - Show ALL */}
        {manga.alternative_names && Array.isArray(manga.alternative_names) && manga.alternative_names.length > 0 && (
          <VStack align="stretch" gap={1}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.400">
              Outros nomes:
            </Text>
            {manga.alternative_names.map((name: string, idx: number) => (
              <Text key={idx} fontSize="xs" color="gray.500" pl={2}>
                • {name}
              </Text>
            ))}
          </VStack>
        )}


        {/* Rating */}
        {manga.rating && Number(manga.rating) > 0 && (
          <HStack gap={1}>
            <Text color="yellow.400" fontSize="sm">⭐</Text>
            <Text fontSize="sm" color="gray.300">{Number(manga.rating).toFixed(1)}</Text>
          </HStack>
        )}
      </VStack>
    </Box>

      <MangaEditModal
        manga={manga}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
