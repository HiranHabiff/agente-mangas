import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Badge,
  Button,
  Spinner,
  Center,
  SimpleGrid,
  Flex,
  IconButton,
  Dialog,
  Checkbox,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiExternalLink, FiTrash2, FiRefreshCw, FiGitMerge, FiCheck } from 'react-icons/fi';
import { duplicatesApi } from '../services/api';
import { getImageUrl } from '../config/api';
import type { MangaComplete } from '../types/manga';

interface DuplicateGroup {
  group: MangaComplete[];
  similarity: string;
}

interface GroupSelection {
  [mangaId: string]: boolean;
}

export function DuplicatesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalDuplicates, setTotalDuplicates] = useState(0);

  // Selection state per group
  const [selections, setSelections] = useState<{ [groupIndex: number]: GroupSelection }>({});

  // Modal states
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [targetMangaId, setTargetMangaId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await duplicatesApi.list();
      setDuplicates(result.groups);
      setTotalGroups(result.total_groups);
      setTotalDuplicates(result.total_duplicates);
      // Reset selections
      setSelections({});
    } catch (err) {
      console.error('Erro ao carregar duplicatas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar duplicatas');
    } finally {
      setLoading(false);
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

  // Toggle selection for a manga in a group
  const toggleSelection = (groupIndex: number, mangaId: string) => {
    setSelections(prev => ({
      ...prev,
      [groupIndex]: {
        ...prev[groupIndex],
        [mangaId]: !prev[groupIndex]?.[mangaId]
      }
    }));
  };

  // Select all in a group
  const selectAll = (groupIndex: number) => {
    const group = duplicates[groupIndex].group;
    const allSelected = group.every(m => selections[groupIndex]?.[m.id]);

    if (allSelected) {
      // Deselect all
      setSelections(prev => ({
        ...prev,
        [groupIndex]: {}
      }));
    } else {
      // Select all
      const newSelection: GroupSelection = {};
      group.forEach(m => { newSelection[m.id] = true; });
      setSelections(prev => ({
        ...prev,
        [groupIndex]: newSelection
      }));
    }
  };

  // Get selected manga IDs for a group
  const getSelectedIds = (groupIndex: number): string[] => {
    const groupSelections = selections[groupIndex] || {};
    return Object.entries(groupSelections)
      .filter(([, selected]) => selected)
      .map(([id]) => id);
  };

  // Get selected count for a group
  const getSelectedCount = (groupIndex: number): number => {
    return getSelectedIds(groupIndex).length;
  };

  // Get sorted selected mangas for merge (prioritize by chapters read, then rating)
  const getSortedSelectedMangas = (groupIndex: number): MangaComplete[] => {
    const selectedIds = getSelectedIds(groupIndex);
    const group = duplicates[groupIndex]?.group || [];

    return selectedIds
      .map(id => group.find(m => m.id === id))
      .filter((m): m is MangaComplete => m !== undefined)
      .sort((a, b) => {
        // First priority: chapters read (higher first)
        const chaptersA = a.last_chapter_read || 0;
        const chaptersB = b.last_chapter_read || 0;
        if (chaptersB !== chaptersA) return chaptersB - chaptersA;

        // Second priority: rating (higher first)
        const ratingA = a.rating ? Number(a.rating) : 0;
        const ratingB = b.rating ? Number(b.rating) : 0;
        if (ratingB !== ratingA) return ratingB - ratingA;

        // Third priority: has image
        const hasImageA = a.image_filename ? 1 : 0;
        const hasImageB = b.image_filename ? 1 : 0;
        if (hasImageB !== hasImageA) return hasImageB - hasImageA;

        // Fourth priority: older creation date (keep the original)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  };

  // Open merge modal
  const openMergeModal = (groupIndex: number) => {
    const selectedIds = getSelectedIds(groupIndex);
    if (selectedIds.length < 2) {
      alert('Selecione pelo menos 2 mangás para mesclar');
      return;
    }
    setActiveGroupIndex(groupIndex);

    // Select best candidate as default target (first in sorted list)
    const sortedMangas = getSortedSelectedMangas(groupIndex);
    setTargetMangaId(sortedMangas[0]?.id || selectedIds[0]);

    setMergeModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (groupIndex: number) => {
    const selectedIds = getSelectedIds(groupIndex);
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos 1 mangá para excluir');
      return;
    }
    setActiveGroupIndex(groupIndex);
    setDeleteModalOpen(true);
  };

  // Handle merge
  const handleMerge = async () => {
    if (activeGroupIndex === null || !targetMangaId) return;

    const selectedIds = getSelectedIds(activeGroupIndex);
    const sourceIds = selectedIds.filter(id => id !== targetMangaId);

    if (sourceIds.length === 0) {
      alert('Selecione pelo menos um mangá além do alvo para mesclar');
      return;
    }

    try {
      setIsProcessing(true);
      await duplicatesApi.merge(targetMangaId, sourceIds);
      setMergeModalOpen(false);
      setActiveGroupIndex(null);
      setTargetMangaId(null);
      await loadDuplicates();
    } catch (err) {
      console.error('Erro ao mesclar mangás:', err);
      alert('Erro ao mesclar mangás');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete multiple
  const handleDeleteMultiple = async () => {
    if (activeGroupIndex === null) return;

    const selectedIds = getSelectedIds(activeGroupIndex);

    try {
      setIsProcessing(true);
      await duplicatesApi.deleteMultiple(selectedIds);
      setDeleteModalOpen(false);
      setActiveGroupIndex(null);
      await loadDuplicates();
    } catch (err) {
      console.error('Erro ao excluir mangás:', err);
      alert('Erro ao excluir mangás');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get manga by ID from active group
  const getMangaFromGroup = (mangaId: string): MangaComplete | undefined => {
    if (activeGroupIndex === null) return undefined;
    return duplicates[activeGroupIndex]?.group.find(m => m.id === mangaId);
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={3}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.400">Analisando duplicatas...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="400px">
        <VStack gap={3}>
          <Text color="red.400" fontSize="lg">Erro ao carregar duplicatas</Text>
          <Text color="gray.400">{error}</Text>
          <Button onClick={loadDuplicates} colorScheme="blue">
            Tentar novamente
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box w="100%" minH="100vh" bg="gray.900" p={{ base: 4, md: 6 }}>
      <VStack gap={6} align="stretch" maxW="1400px" mx="auto">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack align="start" gap={1}>
            <HStack gap={3}>
              <Box as={FiAlertTriangle} color="orange.400" fontSize="28px" />
              <Heading size="xl" color="white">
                Obras Duplicadas
              </Heading>
            </HStack>
            <Text color="gray.400">
              Encontradas {totalGroups} grupo(s) com {totalDuplicates} mangá(s) potencialmente duplicados
            </Text>
          </VStack>

          <Button
            onClick={loadDuplicates}
            colorScheme="blue"
            variant="outline"
          >
            <Box as={FiRefreshCw} mr={2} />
            Atualizar
          </Button>
        </Flex>

        {/* No duplicates message */}
        {duplicates.length === 0 && (
          <Center py={16}>
            <VStack gap={4}>
              <Box
                p={6}
                bg="green.900"
                borderRadius="full"
              >
                <Text fontSize="48px">✓</Text>
              </Box>
              <Heading size="lg" color="green.400">
                Nenhuma duplicata encontrada!
              </Heading>
              <Text color="gray.400" textAlign="center">
                Sua biblioteca está organizada. Não foram encontradas obras com nomes idênticos.
              </Text>
            </VStack>
          </Center>
        )}

        {/* Duplicate groups */}
        <VStack gap={6} align="stretch">
          {duplicates.map((duplicateGroup, groupIndex) => {
            const selectedCount = getSelectedCount(groupIndex);
            const allSelected = duplicateGroup.group.length > 0 &&
              duplicateGroup.group.every(m => selections[groupIndex]?.[m.id]);

            return (
              <Box key={groupIndex} bg="gray.800" borderColor="orange.600" borderWidth="1px" borderRadius="lg" overflow="hidden">
                {/* Header */}
                <Box bg="gray.700" borderBottomWidth="1px" borderColor="gray.600" py={3} px={4}>
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                    <HStack gap={3}>
                      <Checkbox.Root
                        checked={allSelected}
                        onCheckedChange={() => selectAll(groupIndex)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control
                          borderColor="gray.500"
                          _checked={{ bg: 'blue.500', borderColor: 'blue.500' }}
                        >
                          <Checkbox.Indicator>
                            <FiCheck />
                          </Checkbox.Indicator>
                        </Checkbox.Control>
                      </Checkbox.Root>
                      <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                        Grupo {groupIndex + 1}
                      </Badge>
                      <Text color="gray.300" fontSize="sm">
                        {duplicateGroup.group.length} obras com nome similar
                      </Text>
                      {selectedCount > 0 && (
                        <Badge colorScheme="blue" fontSize="sm">
                          {selectedCount} selecionado(s)
                        </Badge>
                      )}
                    </HStack>

                    <HStack gap={3}>
                      <Text color="orange.300" fontSize="sm" fontWeight="medium">
                        Match: "{duplicateGroup.similarity}"
                      </Text>
                      <Button
                        size="sm"
                        onClick={() => openMergeModal(groupIndex)}
                        disabled={selectedCount < 2}
                        bg={selectedCount >= 2 ? 'purple.600' : 'gray.600'}
                        color="white"
                        _hover={selectedCount >= 2 ? { bg: 'purple.500' } : {}}
                        _disabled={{ bg: 'gray.600', color: 'gray.400', cursor: 'not-allowed', opacity: 0.6 }}
                      >
                        <Box as={FiGitMerge} mr={2} />
                        Mesclar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openDeleteModal(groupIndex)}
                        disabled={selectedCount === 0}
                        bg={selectedCount > 0 ? 'red.600' : 'gray.600'}
                        color="white"
                        _hover={selectedCount > 0 ? { bg: 'red.500' } : {}}
                        _disabled={{ bg: 'gray.600', color: 'gray.400', cursor: 'not-allowed', opacity: 0.6 }}
                      >
                        <Box as={FiTrash2} mr={2} />
                        Excluir
                      </Button>
                    </HStack>
                  </Flex>
                </Box>

                {/* Body */}
                <Box p={4}>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: duplicateGroup.group.length }} gap={4}>
                    {duplicateGroup.group.map((manga) => {
                      const isSelected = selections[groupIndex]?.[manga.id] || false;

                      return (
                        <Box
                          key={manga.id}
                          bg={isSelected ? 'blue.900' : 'gray.700'}
                          borderColor={isSelected ? 'blue.500' : 'gray.600'}
                          borderWidth="2px"
                          borderRadius="md"
                          overflow="hidden"
                          _hover={{ borderColor: isSelected ? 'blue.400' : 'blue.500' }}
                          transition="all 0.2s"
                          cursor="pointer"
                          onClick={() => toggleSelection(groupIndex, manga.id)}
                        >
                          <HStack align="stretch" gap={0}>
                            {/* Checkbox overlay */}
                            <Box position="absolute" top={2} left={2} zIndex={1}>
                              <Checkbox.Root
                                checked={isSelected}
                                onCheckedChange={() => toggleSelection(groupIndex, manga.id)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control
                                  bg={isSelected ? 'blue.500' : 'gray.600'}
                                  borderColor={isSelected ? 'blue.500' : 'gray.500'}
                                >
                                  <Checkbox.Indicator>
                                    <FiCheck />
                                  </Checkbox.Indicator>
                                </Checkbox.Control>
                              </Checkbox.Root>
                            </Box>

                            {/* Image */}
                            <Box flexShrink={0} w="100px" h="150px" position="relative">
                              {manga.image_filename ? (
                                <Image
                                  src={getImageUrl(manga.image_filename)}
                                  alt={manga.primary_title}
                                  w="100%"
                                  h="100%"
                                  objectFit="cover"
                                />
                              ) : (
                                <Center w="100%" h="100%" bg="gray.600">
                                  <Text color="gray.400" fontSize="xs">Sem capa</Text>
                                </Center>
                              )}
                            </Box>

                            {/* Info */}
                            <VStack flex={1} align="stretch" p={3} gap={2}>
                              <Text
                                color="white"
                                fontWeight="semibold"
                                fontSize="sm"
                                lineClamp={2}
                              >
                                {manga.primary_title}
                              </Text>

                              {/* Alternative names */}
                              {manga.alternative_names && manga.alternative_names.length > 0 && (
                                <Text color="gray.400" fontSize="xs" lineClamp={1}>
                                  Alt: {manga.alternative_names.join(', ')}
                                </Text>
                              )}

                              <HStack gap={2} flexWrap="wrap">
                                <Badge
                                  colorScheme={getStatusColor(manga.status)}
                                  fontSize="xs"
                                >
                                  {getStatusLabel(manga.status)}
                                </Badge>
                                <Badge colorScheme="blue" fontSize="xs">
                                  Cap. {manga.last_chapter_read || 0}
                                </Badge>
                                {manga.rating && (
                                  <Badge colorScheme="yellow" fontSize="xs">
                                    ★ {Number(manga.rating).toFixed(1)}
                                  </Badge>
                                )}
                              </HStack>

                              <Text color="gray.400" fontSize="xs">
                                Criado: {new Date(manga.created_at).toLocaleDateString('pt-BR')}
                              </Text>

                              {/* Actions */}
                              <HStack gap={2} mt="auto">
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/mangas/${manga.id}`);
                                  }}
                                >
                                  <Box as={FiExternalLink} mr={1} fontSize="12px" />
                                  Ver
                                </Button>
                              </HStack>
                            </VStack>
                          </HStack>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              </Box>
            );
          })}
        </VStack>

        {/* Help text */}
        {duplicates.length > 0 && (
          <Box bg="gray.800" borderColor="gray.700" borderWidth="1px" borderRadius="lg" p={4}>
            <VStack align="start" gap={2}>
              <Text color="gray.300" fontWeight="semibold">
                Como resolver duplicatas?
              </Text>
              <Text color="gray.400" fontSize="sm">
                1. Selecione os mangás clicando nos cards ou nos checkboxes
              </Text>
              <Text color="gray.400" fontSize="sm">
                2. Use "Mesclar" para unificar os dados (mantém o alvo, exclui os outros com suas imagens)
              </Text>
              <Text color="gray.400" fontSize="sm">
                3. Ou use "Excluir" para remover os selecionados permanentemente
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Merge Modal */}
      <Dialog.Root
        open={mergeModalOpen}
        onOpenChange={(e) => !e.open && setMergeModalOpen(false)}
      >
        <Dialog.Backdrop bg="blackAlpha.800" />
        <Dialog.Positioner>
          <Dialog.Content bg="gray.800" borderColor="purple.600" borderWidth="2px" maxW="600px">
            <Dialog.Header bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
              <HStack gap={3}>
                <Box p={2} bg="purple.900" borderRadius="full">
                  <Box as={FiGitMerge} color="purple.400" fontSize="20px" />
                </Box>
                <Dialog.Title color="white" fontSize="xl" fontWeight="bold">
                  Mesclar Mangás
                </Dialog.Title>
              </HStack>
            </Dialog.Header>

            <Dialog.Body py={6}>
              <VStack align="stretch" gap={4}>
                <Text color="gray.200">
                  Selecione qual mangá deve ser mantido. Os dados dos outros serão mesclados nele e depois excluídos.
                </Text>

                <Box>
                  <Text color="gray.400" fontSize="sm" mb={2}>
                    Escolha o mangá principal (será mantido) - ordenado por progresso:
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {activeGroupIndex !== null && getSortedSelectedMangas(activeGroupIndex).map((manga, index) => {
                      const isRecommended = index === 0;

                      return (
                        <Box
                          key={manga.id}
                          p={3}
                          bg={targetMangaId === manga.id ? 'purple.900' : 'gray.700'}
                          borderColor={targetMangaId === manga.id ? 'purple.500' : 'gray.600'}
                          borderWidth="2px"
                          borderRadius="md"
                          cursor="pointer"
                          onClick={() => setTargetMangaId(manga.id)}
                          _hover={{ borderColor: 'purple.400' }}
                        >
                          <HStack gap={3}>
                            {manga.image_filename ? (
                              <Image
                                src={getImageUrl(manga.image_filename)}
                                alt={manga.primary_title}
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
                            <VStack align="start" gap={1} flex={1}>
                              <HStack gap={2}>
                                <Text color="white" fontWeight="semibold" fontSize="sm">
                                  {manga.primary_title}
                                </Text>
                                {isRecommended && (
                                  <Badge colorScheme="green" fontSize="xs">
                                    Recomendado
                                  </Badge>
                                )}
                              </HStack>
                              <HStack gap={2}>
                                <Badge colorScheme={getStatusColor(manga.status)} fontSize="xs">
                                  {getStatusLabel(manga.status)}
                                </Badge>
                                <Badge
                                  colorScheme={(manga.last_chapter_read || 0) > 0 ? 'blue' : 'gray'}
                                  fontSize="xs"
                                >
                                  Cap. {manga.last_chapter_read || 0}
                                </Badge>
                                {manga.rating && (
                                  <Badge colorScheme="yellow" fontSize="xs">
                                    ★ {Number(manga.rating).toFixed(1)}
                                  </Badge>
                                )}
                              </HStack>
                            </VStack>
                            {targetMangaId === manga.id && (
                              <Badge colorScheme="purple" fontSize="sm">
                                Principal
                              </Badge>
                            )}
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                <Box bg="purple.900" p={4} borderRadius="md" borderWidth="1px" borderColor="purple.700">
                  <Text color="purple.200" fontSize="sm">
                    O mangá principal receberá: tags combinadas, nomes alternativos, maior nota, maior capítulo lido, sinopse mais completa. As imagens dos mangás mesclados serão excluídas.
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer borderTopWidth="1px" borderColor="gray.700">
              <HStack justify="flex-end" w="100%" gap={3}>
                <Button
                  variant="outline"
                  onClick={() => setMergeModalOpen(false)}
                  color="gray.300"
                  borderColor="gray.600"
                  _hover={{ bg: 'gray.700', color: 'white' }}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  colorScheme="purple"
                  onClick={handleMerge}
                  bg="purple.600"
                  _hover={{ bg: 'purple.700' }}
                  loading={isProcessing}
                  loadingText="Mesclando..."
                  disabled={!targetMangaId}
                >
                  Mesclar Mangás
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete Multiple Modal */}
      <Dialog.Root
        open={deleteModalOpen}
        onOpenChange={(e) => !e.open && setDeleteModalOpen(false)}
        role="alertdialog"
      >
        <Dialog.Backdrop bg="blackAlpha.800" />
        <Dialog.Positioner>
          <Dialog.Content bg="gray.800" borderColor="red.600" borderWidth="2px" maxW="500px">
            <Dialog.Header bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
              <HStack gap={3}>
                <Box p={2} bg="red.900" borderRadius="full">
                  <Box as={FiTrash2} color="red.400" fontSize="20px" />
                </Box>
                <Dialog.Title color="white" fontSize="xl" fontWeight="bold">
                  Excluir Selecionados
                </Dialog.Title>
              </HStack>
            </Dialog.Header>

            <Dialog.Body py={6}>
              <VStack align="stretch" gap={4}>
                <Text color="gray.200">
                  Tem certeza que deseja excluir {activeGroupIndex !== null ? getSelectedCount(activeGroupIndex) : 0} mangá(s)?
                </Text>

                {activeGroupIndex !== null && (
                  <VStack align="stretch" gap={2}>
                    {getSelectedIds(activeGroupIndex).map(id => {
                      const manga = getMangaFromGroup(id);
                      if (!manga) return null;

                      return (
                        <HStack key={id} p={2} bg="gray.700" borderRadius="md" gap={2}>
                          {manga.image_filename && (
                            <Image
                              src={getImageUrl(manga.image_filename)}
                              alt={manga.primary_title}
                              w="30px"
                              h="45px"
                              objectFit="cover"
                              borderRadius="sm"
                            />
                          )}
                          <Text color="gray.300" fontSize="sm" flex={1}>
                            {manga.primary_title}
                          </Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                )}

                <Box bg="red.900" p={4} borderRadius="md" borderWidth="1px" borderColor="red.700">
                  <Text color="red.200" fontSize="sm">
                    ⚠️ Esta ação não pode ser desfeita. Os mangás serão excluídos permanentemente, incluindo seus arquivos de imagem.
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer borderTopWidth="1px" borderColor="gray.700">
              <HStack justify="flex-end" w="100%" gap={3}>
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  color="gray.300"
                  borderColor="gray.600"
                  _hover={{ bg: 'gray.700', color: 'white' }}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteMultiple}
                  bg="red.600"
                  _hover={{ bg: 'red.700' }}
                  loading={isProcessing}
                  loadingText="Excluindo..."
                >
                  Excluir Selecionados
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
