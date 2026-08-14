import { Suspense, lazy } from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';

// Uma page por chunk — equivalente ao code-splitting por rota do App Router.
const DashboardPage = lazy(() => import('@/pages/dashboard-page'));
const MangasPage = lazy(() => import('@/pages/mangas-page'));
const MangaDetailPage = lazy(() => import('@/pages/manga-detail-page'));
const EditMangaPage = lazy(() => import('@/pages/manga-edit-page'));
const ListsPage = lazy(() => import('@/pages/lists-page'));
const ListDetailPage = lazy(() => import('@/pages/list-detail-page'));
const DuplicatesPage = lazy(() => import('@/pages/duplicates-page'));
const AdminPage = lazy(() => import('@/pages/admin-page'));
const AdminSitesPage = lazy(() => import('@/pages/admin-sites-page'));
const AdminTablePage = lazy(() => import('@/pages/admin-table-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Equivalente ao RootLayout do App Router: header fixo, container central e Toaster.
 */
function RootLayout() {
  return (
    <>
      <Header />
      <main className="container py-6">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/mangas" element={<MangasPage />} />
            <Route path="/mangas/:id" element={<MangaDetailPage />} />
            <Route path="/mangas/:id/edit" element={<EditMangaPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:id" element={<ListDetailPage />} />
            <Route path="/duplicates" element={<DuplicatesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/sites" element={<AdminSitesPage />} />
            <Route path="/admin/:table" element={<AdminTablePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
