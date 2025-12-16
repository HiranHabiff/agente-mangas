import { Box, HStack, Button, Heading, IconButton } from '@chakra-ui/react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';

export function Layout() {
  const location = useLocation();

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box bg="gray.800" borderBottomWidth="1px" borderColor="gray.700" py={4} shadow="md">
        <Box px={6}>
          <HStack justify="space-between">
            <Heading size="md" color="white">Manga Agent</Heading>
            <HStack gap={2}>
              <Button
                as={Link}
                to="/"
                variant={location.pathname === '/' ? 'solid' : 'ghost'}
                colorScheme="blue"
                color={location.pathname === '/' ? 'white' : 'gray.300'}
              >
                Dashboard
              </Button>
              <Button
                as={Link}
                to="/mangas"
                variant={location.pathname === '/mangas' ? 'solid' : 'ghost'}
                colorScheme="blue"
                color={location.pathname === '/mangas' ? 'white' : 'gray.300'}
              >
                Mangás
              </Button>
              <Button
                as={Link}
                to="/duplicates"
                variant={location.pathname === '/duplicates' ? 'solid' : 'ghost'}
                colorScheme="orange"
                color={location.pathname === '/duplicates' ? 'white' : 'gray.300'}
              >
                Duplicatas
              </Button>
              <Button
                as={Link}
                to="/chat"
                variant={location.pathname === '/chat' ? 'solid' : 'ghost'}
                colorScheme="blue"
                color={location.pathname === '/chat' ? 'white' : 'gray.300'}
              >
                Chat AI
              </Button>
              <IconButton
                as="a"
                href="https://github.com/HiranHabiff/agente-mangas"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                variant="ghost"
                fontSize="xl"
                _hover={{ bg: 'gray.700' }}
              >
                <Box as={FaGithub} color="white" />
              </IconButton>
            </HStack>
          </HStack>
        </Box>
      </Box>

      {/* Main Content */}
      <Box px={6} py={6} w="100%">
        <Outlet />
      </Box>
    </Box>
  );
}
