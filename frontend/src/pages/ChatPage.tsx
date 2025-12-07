import { useState, useRef, useEffect } from 'react';
import { Box, VStack, HStack, Textarea, Button, Text, Spinner, Image, Badge, SimpleGrid, Heading, IconButton, Flex } from '@chakra-ui/react';
import { FiSend, FiUser, FiCpu, FiBook, FiStar, FiPlus, FiTrash2, FiMessageSquare, FiMenu } from 'react-icons/fi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  toolExecuted?: string;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá! Sou seu assistente de mangás. Posso ajudá-lo a:\n\n• Buscar e listar mangás\n• Adicionar novos mangás\n• Atualizar progresso de leitura\n• Criar lembretes\n• Recomendar mangás similares\n• Fazer consultas complexas ao banco de dados\n• Buscar informações sobre mangás na web\n\nO que você gostaria de fazer?',
  timestamp: new Date(),
};

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chatSessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastMessageAt: new Date(s.lastMessageAt),
        messages: s.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
    }
    // Create initial session
    const initialSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Nova Conversa',
      messages: [WELCOME_MESSAGE],
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };
    return [initialSession];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessions[0]?.id);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onSidebarToggle = () => setIsSidebarOpen(!isSidebarOpen);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const updateCurrentSession = (updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, ...updates, lastMessageAt: new Date() }
        : s
    ));
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Nova Conversa',
      messages: [WELCOME_MESSAGE],
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      // Don't delete if it's the last session
      return;
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    updateCurrentSession({ messages: newMessages });
    
    // Update session name based on first user message
    if (messages.length === 1 && currentSession.name === 'Nova Conversa') {
      const name = input.slice(0, 30) + (input.length > 30 ? '...' : '');
      updateCurrentSession({ name });
    }

    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        data: data.data,
        toolExecuted: data.toolExecuted,
      };

      updateCurrentSession({ messages: [...newMessages, assistantMessage] });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      updateCurrentSession({ messages: [...newMessages, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const getImageUrl = (filename: string | null) => {
    if (!filename) return null;
    return `http://localhost:3000/images/${filename}`;
  };

  const renderMangaCard = (manga: any) => (
    <Box
      key={manga.id}
      bg="gray.800"
      borderWidth="1px"
      borderColor="gray.700"
      borderRadius="lg"
      overflow="hidden"
      _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
      transition="all 0.2s"
    >
      <HStack align="start" spacing={3} p={3}>
        {/* Image */}
        {manga.image_filename && (
          <Box
            w="80px"
            h="120px"
            flexShrink={0}
            borderRadius="md"
            overflow="hidden"
            bg="gray.700"
          >
            <Image
              src={getImageUrl(manga.image_filename)}
              alt={manga.primary_title}
              w="100%"
              h="100%"
              objectFit="cover"
              fallback={
                <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
                  <Box as={FiBook} color="gray.500" size="32px" />
                </Box>
              }
            />
          </Box>
        )}

        {/* Info */}
        <VStack align="start" flex={1} spacing={2}>
          <Heading size="sm" color="white" noOfLines={2}>
            {manga.primary_title}
          </Heading>

          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme={
              manga.status === 'reading' ? 'green' :
              manga.status === 'completed' ? 'purple' :
              manga.status === 'paused' ? 'orange' :
              manga.status === 'dropped' ? 'red' : 'cyan'
            }>
              {manga.status}
            </Badge>

            {manga.rating && (
              <HStack spacing={1} fontSize="sm" color="yellow.400">
                <Box as={FiStar} />
                <Text fontWeight="bold">{manga.rating}</Text>
              </HStack>
            )}
          </HStack>

          {/* Progress */}
          {manga.last_chapter_read !== undefined && (
            <Box w="100%">
              <Text fontSize="xs" color="gray.400" mb={1}>
                Capítulos: {manga.last_chapter_read}
                {manga.total_chapters ? `/${manga.total_chapters}` : ''}
              </Text>
              {manga.total_chapters && (
                <Box w="100%" h="4px" bg="gray.700" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    bg="blue.500"
                    w={`${(manga.last_chapter_read / manga.total_chapters) * 100}%`}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Tags */}
          {manga.tags && Array.isArray(manga.tags) && manga.tags.length > 0 && (
            <HStack spacing={1} flexWrap="wrap">
              {manga.tags.slice(0, 3).map((tag: string) => (
                <Text key={tag} fontSize="xs" color="gray.500">
                  #{tag}
                </Text>
              ))}
              {manga.tags.length > 3 && (
                <Text fontSize="xs" color="gray.500">
                  +{manga.tags.length - 3}
                </Text>
              )}
            </HStack>
          )}

          {/* Alternative Names */}
          {manga.alternative_names && Array.isArray(manga.alternative_names) && manga.alternative_names.length > 0 && (
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              Também: {manga.alternative_names.slice(0, 2).join(', ')}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  );

  const renderMessageContent = (message: Message) => {
    // If message has manga data, render cards
    if (message.data && Array.isArray(message.data) && message.data.length > 0 && message.data[0].primary_title) {
      return (
        <Box w="100%">
          {/* Show summary text */}
          {message.content && !message.content.includes('```') && (
            <Text color="white" mb={4}>
              {message.content.split('\n').slice(0, 2).join('\n')}
            </Text>
          )}
          
          {/* Grid of manga cards */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} w="100%">
            {message.data.map((manga: any) => renderMangaCard(manga))}
          </SimpleGrid>
        </Box>
      );
    }

    // Default text rendering with better formatting
    return (
      <Box w="100%">
        {message.content.split('\n').map((line, idx) => {
          // Headers
          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <Heading key={idx} size="sm" color="blue.400" mt={idx > 0 ? 3 : 0} mb={2}>
                {line.replace(/\*\*/g, '')}
              </Heading>
            );
          }
          
          // List items
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <HStack key={idx} align="start" spacing={2} ml={2} mb={1}>
                <Text color="blue.500">•</Text>
                <Text color="white">{line.replace(/^[•\-]\s*/, '')}</Text>
              </HStack>
            );
          }

          // Numbered items
          if (/^\d+\./.test(line.trim())) {
            return (
              <Text key={idx} color="white" mb={1} ml={2}>
                {line}
              </Text>
            );
          }

          // Empty lines
          if (line.trim() === '') {
            return <Box key={idx} h={2} />;
          }

          // Regular text
          return (
            <Text key={idx} color="white" whiteSpace="pre-wrap">
              {line}
            </Text>
          );
        })}
      </Box>
    );
  };

  return (
    <HStack w="100%" h="calc(100vh - 120px)" align="stretch" spacing={0}>
      {/* Sidebar - Session History */}
      {isSidebarOpen && (
        <VStack
          w="280px"
          h="100%"
          bg="gray.900"
          borderWidth="1px"
          borderColor="gray.700"
          borderRadius="lg"
          p={3}
          spacing={3}
          align="stretch"
          flexShrink={0}
        >
          {/* New Chat Button */}
          <Button
            colorScheme="blue"
            size="sm"
            onClick={createNewSession}
            w="100%"
          >
            + Nova Conversa
          </Button>

          <Box h="1px" bg="gray.700" w="100%" />

          {/* Sessions List */}
          <VStack
            flex={1}
            overflowY="auto"
            spacing={2}
            align="stretch"
            css={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: 'gray.600', borderRadius: '3px' },
            }}
          >
            {sessions.map((session) => (
              <Box
                key={session.id}
                p={3}
                borderRadius="md"
                bg={session.id === currentSessionId ? 'blue.900' : 'gray.800'}
                borderWidth="1px"
                borderColor={session.id === currentSessionId ? 'blue.700' : 'gray.700'}
                cursor="pointer"
                _hover={{ bg: session.id === currentSessionId ? 'blue.800' : 'gray.750' }}
                onClick={() => setCurrentSessionId(session.id)}
                position="relative"
              >
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1} flex={1}>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color="white"
                      noOfLines={1}
                    >
                      💬 {session.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {session.lastMessageAt.toLocaleDateString()} {session.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {session.messages.length} mensagens
                    </Text>
                  </VStack>
                  
                  {sessions.length > 1 && (
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      🗑️
                    </Button>
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      )}

      {/* Main Chat Area */}
      <Box flex={1} display="flex" flexDirection="column" ml={isSidebarOpen ? 3 : 0}>
        {/* Header with toggle */}
        <Flex mb={3} justify="space-between" align="center">
          <Button
            onClick={onSidebarToggle}
            variant="ghost"
            colorScheme="blue"
            size="sm"
          >
            ☰
          </Button>
          <Text fontSize="lg" fontWeight="bold" color="white">
            {currentSession?.name || 'Chat'}
          </Text>
          <Box w="40px" /> {/* Spacer for alignment */}
        </Flex>

        {/* Chat Messages */}
        <VStack
          flex={1}
          overflowY="auto"
          spacing={4}
          align="stretch"
          p={4}
          bg="gray.900"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.700"
          css={{
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'gray.600', borderRadius: '4px' },
          }}
        >
          {messages.map((message, index) => (
            <HStack
              key={index}
              align="start"
              spacing={3}
              justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
            >
              {message.role === 'assistant' && (
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg="blue.900"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  fontSize="20px"
                >
                  🤖
                </Flex>
              )}

              <Box
                maxW="70%"
                p={4}
                borderRadius="lg"
                bg={message.role === 'user' ? 'blue.900' : 'gray.800'}
                borderWidth="1px"
                borderColor={message.role === 'user' ? 'blue.700' : 'gray.700'}
              >
                {message.role === 'assistant' ? (
                  renderMessageContent(message)
                ) : (
                  <Text color="white" whiteSpace="pre-wrap">
                    {message.content}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500" mt={2}>
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </Box>

              {message.role === 'user' && (
                <Flex
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg="green.900"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  fontSize="20px"
                >
                  👤
                </Flex>
              )}
            </HStack>
          ))}

          {isLoading && (
            <HStack align="start" spacing={3}>
              <Flex w="32px" h="32px" borderRadius="full" bg="blue.900" align="center" justify="center" fontSize="20px">
                🤖
              </Flex>
              <Box
                p={4}
                borderRadius="lg"
                bg="gray.800"
                borderWidth="1px"
                borderColor="gray.700"
              >
                <HStack spacing={2}>
                  <Spinner size="sm" color="blue.400" />
                  <Text color="gray.400">Pensando...</Text>
                </HStack>
              </Box>
            </HStack>
          )}

          <div ref={messagesEndRef} />
        </VStack>

        {/* Input Area */}
        <HStack mt={4} spacing={2} align="flex-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
            bg="gray.800"
            borderColor="gray.700"
            color="white"
            _placeholder={{ color: 'gray.500' }}
            _hover={{ borderColor: 'gray.600' }}
            _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
            disabled={isLoading}
            resize="none"
            minH="52px"
            maxH="200px"
            rows={1}
            css={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: 'gray.600', borderRadius: '3px' },
            }}
          />
          <Button
            onClick={handleSend}
            colorScheme="blue"
            disabled={!input.trim() || isLoading}
            size="lg"
            px={8}
            h="52px"
          >
            ➤
          </Button>
        </HStack>
      </Box>
    </HStack>
  );
}
