import { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Textarea,
  Button,
  Text,
  Spinner,
  IconButton,
  Flex,
  Dialog,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { FiSend, FiUser, FiCpu, FiX } from 'react-icons/fi';
import type { MangaComplete } from '../../types/manga';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MangaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  manga: MangaComplete;
}

export function MangaChatModal({ isOpen, onClose, manga }: MangaChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with context message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const contextMessage: Message = {
        role: 'assistant',
        content: `Olá! Estou aqui para ajudá-lo com "${manga.primary_title}".\n\nEu tenho acesso a todas as informações deste mangá:\n• ID: ${manga.id}\n• Status: ${manga.status}\n• Capítulos: ${manga.last_chapter_read || 0}/${manga.total_chapters || '?'}\n• Nota: ${manga.rating || 'Sem nota'}\n\nPosso ajudá-lo a:\n✓ Editar informações do mangá\n✓ Adicionar/atualizar imagem de capa\n✓ Atualizar progresso de leitura\n✓ Buscar informações adicionais na web\n✓ Criar lembretes\n✓ Recomendar mangás similares\n\nComo posso ajudar?`,
        timestamp: new Date(),
      };
      setMessages([contextMessage]);
    }
  }, [isOpen, manga]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    try {
      // Build context with manga info and conversation history
      const mangaContext = `[CONTEXTO DO MANGÁ]
ID: ${manga.id}
Título: ${manga.primary_title}
Nomes Alternativos: ${manga.alternative_names?.join(', ') || 'N/A'}
Sinopse: ${manga.synopsis || 'N/A'}
Status: ${manga.status}
Capítulo Atual: ${manga.last_chapter_read || 0}
Total de Capítulos: ${manga.total_chapters || 'N/A'}
Nota: ${manga.rating || 'N/A'}
Tags: ${manga.tags?.join(', ') || 'N/A'}
Gêneros: ${manga.genres?.join(', ') || 'N/A'}
Temas: ${manga.themes?.join(', ') || 'N/A'}
Autor: ${manga.author || 'N/A'}
Editora: ${manga.publisher || 'N/A'}
URL: ${manga.url || 'N/A'}
Notas do Usuário: ${manga.user_notes || 'N/A'}`;

      // Build conversation history (excluding the initial welcome message)
      const conversationHistory = currentMessages
        .slice(1) // Skip welcome message
        .map(msg => `[${msg.role === 'user' ? 'USUÁRIO' : 'ASSISTENTE'}]: ${msg.content}`)
        .join('\n\n');

      const contextualPrompt = conversationHistory 
        ? `${mangaContext}\n\n[HISTÓRICO DA CONVERSA]\n${conversationHistory}`
        : `${mangaContext}\n\n[PERGUNTA DO USUÁRIO]\n${input}`;

      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextualPrompt,
          sessionId: `manga-${manga.id}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="full">
      <Dialog.Backdrop bg="blackAlpha.700" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="gray.900"
          borderColor="gray.700"
          borderWidth="1px"
          maxH="95vh"
          h="95vh"
          style={{
            width: '1650px',
            maxWidth: '85vw',
          }}
        >
          <Dialog.Header bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
            <HStack justify="space-between" w="100%">
              <VStack align="start" gap={1}>
                <Dialog.Title color="white" fontSize="xl" fontWeight="bold">
                  Chat AI - {manga.primary_title}
                </Dialog.Title>
                <HStack gap={2}>
                  <Badge colorScheme="blue" fontSize="xs">
                    Cap. {manga.last_chapter_read || 0}
                  </Badge>
                  <Badge colorScheme="purple" fontSize="xs">
                    {manga.status}
                  </Badge>
                </HStack>
              </VStack>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label="Fechar"
                  icon={<Box as={FiX} />}
                  variant="ghost"
                  color="gray.400"
                  size="sm"
                  _hover={{ bg: 'gray.700', color: 'white' }}
                />
              </Dialog.CloseTrigger>
            </HStack>
          </Dialog.Header>

          <Dialog.Body p={0} flex={1} overflow="hidden">
            <VStack h="100%" align="stretch" gap={0}>
              {/* Messages */}
              <Box
                flex={1}
                overflowY="auto"
                p={4}
                bg="gray.900"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#1a202c',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#4a5568',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#718096',
                  },
                }}
              >
                <VStack gap={4} align="stretch">
                  {messages.map((message, index) => (
                    <Flex
                      key={index}
                      justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    >
                      <HStack
                        gap={3}
                        maxW="85%"
                        align="start"
                        flexDir={message.role === 'user' ? 'row-reverse' : 'row'}
                      >
                        {/* Avatar */}
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          bg={message.role === 'user' ? 'blue.600' : 'purple.600'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <Box
                            as={message.role === 'user' ? FiUser : FiCpu}
                            color="white"
                            fontSize="16px"
                          />
                        </Box>

                        {/* Message bubble */}
                        <Box
                          bg={message.role === 'user' ? 'blue.700' : 'gray.800'}
                          borderColor={message.role === 'user' ? 'blue.600' : 'gray.700'}
                          borderWidth="1px"
                          borderRadius="lg"
                          p={3}
                          position="relative"
                        >
                          <Text
                            color="white"
                            whiteSpace="pre-wrap"
                            fontSize="sm"
                            lineHeight="1.6"
                          >
                            {message.content}
                          </Text>
                          <Text
                            color="gray.500"
                            fontSize="xs"
                            mt={1}
                            textAlign={message.role === 'user' ? 'right' : 'left'}
                          >
                            {message.timestamp.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </Box>
                      </HStack>
                    </Flex>
                  ))}

                  {loading && (
                    <Flex justify="flex-start">
                      <HStack gap={3} maxW="85%" align="start">
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          bg="purple.600"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Box as={FiCpu} color="white" fontSize="16px" />
                        </Box>
                        <Box
                          bg="gray.800"
                          borderColor="gray.700"
                          borderWidth="1px"
                          borderRadius="lg"
                          p={3}
                        >
                          <HStack gap={2}>
                            <Spinner size="sm" color="purple.400" />
                            <Text color="gray.400" fontSize="sm">
                              Pensando...
                            </Text>
                          </HStack>
                        </Box>
                      </HStack>
                    </Flex>
                  )}

                  <div ref={messagesEndRef} />
                </VStack>
              </Box>

              {/* Input area */}
              <Box
                p={4}
                borderTopWidth="1px"
                borderColor="gray.700"
                bg="gray.800"
                flexShrink={0}
              >
                <VStack gap={2} align="stretch">
                  <HStack gap={2} align="flex-end">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        // Auto-resize textarea
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                      resize="none"
                      bg="gray.900"
                      borderColor="gray.600"
                      color="white"
                      fontSize="md"
                      minH="50px"
                      maxH="200px"
                      _placeholder={{ color: 'gray.500' }}
                      _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                      disabled={loading}
                      css={{
                        '&::-webkit-scrollbar': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#1a202c',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#4a5568',
                          borderRadius: '3px',
                        },
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      colorScheme="purple"
                      isDisabled={!input.trim() || loading}
                      h="50px"
                      px={6}
                      flexShrink={0}
                    >
                      <Box as={FiSend} fontSize="20px" />
                    </Button>
                  </HStack>
                  <Text color="gray.600" fontSize="xs">
                    O AI tem acesso completo aos dados deste mangá
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
