'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
const BASE_URL = API_URL.replace('/api', '');

interface MangaImageProps {
  src?: string | null;
  filename?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  placeholderClassName?: string;
}

function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getImageSrc(filename?: string | null, src?: string | null): string | null {
  // Prioridade 1: arquivo local (imageFilename)
  if (filename) {
    return `${BASE_URL}/images/${filename}`;
  }
  // Prioridade 2: URL externa (imageUrl)
  if (isValidUrl(src)) {
    return src!;
  }
  return null;
}

export function MangaImage({
  src,
  filename,
  alt,
  className,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw',
  placeholderClassName,
}: MangaImageProps) {
  const [error, setError] = useState(false);
  const [fallbackToExternal, setFallbackToExternal] = useState(false);

  // Tenta local primeiro, depois externo
  const localSrc = filename ? `${BASE_URL}/images/${filename}` : null;
  const externalSrc = isValidUrl(src) ? src : null;

  const imageSrc = error && fallbackToExternal
    ? null  // Ambos falharam
    : error && localSrc && externalSrc
    ? externalSrc  // Local falhou, tenta externo
    : localSrc || externalSrc;  // Usa local se disponível, senão externo

  const handleError = () => {
    if (localSrc && externalSrc && !fallbackToExternal) {
      // Local falhou, tenta externo
      setError(false);
      setFallbackToExternal(true);
    } else {
      // Tudo falhou
      setError(true);
    }
  };

  if (!imageSrc || error) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center bg-muted', placeholderClassName)}>
        <BookOpen className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      key={fallbackToExternal ? 'external' : 'local'}
      src={imageSrc}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      sizes={sizes}
      onError={handleError}
      unoptimized
    />
  );
}
