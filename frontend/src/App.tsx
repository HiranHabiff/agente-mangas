import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { MangasPage } from './pages/MangasPage';
import { MangaDetailPage } from './pages/MangaDetailPage';
import { ChatPage } from './pages/ChatPage';
import { DuplicatesPage } from './pages/DuplicatesPage';

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="mangas" element={<MangasPage />} />
            <Route path="mangas/:id" element={<MangaDetailPage />} />
            <Route path="duplicates" element={<DuplicatesPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
