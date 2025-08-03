// src/components/ui/video-player.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Props do componente VideoPlayer
 */
interface VideoPlayerProps {
  /**
   * URL do vídeo
   */
  src: string;

  /**
   * URL da imagem de poster/thumbnail
   */
  poster?: string;

  /**
   * Título do vídeo (para acessibilidade)
   */
  title?: string;

  /**
   * Descrição do vídeo
   */
  description?: string;

  /**
   * Se deve reproduzir automaticamente
   * @default false
   */
  autoPlay?: boolean;

  /**
   * Se deve mostrar controles
   * @default true
   */
  controls?: boolean;

  /**
   * Se deve fazer loop
   * @default false
   */
  loop?: boolean;

  /**
   * Se deve estar mudo por padrão
   * @default false
   */
  muted?: boolean;

  /**
   * Modo de preload
   * @default "metadata"
   */
  preload?: "none" | "metadata" | "auto";

  /**
   * Largura do vídeo
   */
  width?: number | string;

  /**
   * Altura do vídeo
   */
  height?: number | string;

  /**
   * Proporção (aspect ratio)
   * @default "16/9"
   */
  aspectRatio?: "16/9" | "4/3" | "1/1" | "21/9" | string;

  /**
   * Classes CSS customizadas
   */
  className?: string;

  /**
   * Callback quando o vídeo inicia
   */
  onPlay?: () => void;

  /**
   * Callback quando o vídeo pausa
   */
  onPause?: () => void;

  /**
   * Callback quando o vídeo termina
   */
  onEnded?: () => void;

  /**
   * Callback quando há erro no carregamento
   */
  onError?: (error: Event) => void;

  /**
   * Se deve usar lazy loading
   * @default true
   */
  lazy?: boolean;

  /**
   * Texto alternativo para casos de erro
   */
  fallbackText?: string;
}

/**
 * Componente VideoPlayer
 *
 * Player de vídeo responsivo com suporte a lazy loading,
 * controles customizados e fallbacks.
 *
 * @example
 * ```tsx
 * // Vídeo básico
 * <VideoPlayer
 *   src="/videos/tutorial.mp4"
 *   poster="/images/tutorial-thumb.jpg"
 *   title="Tutorial de uso"
 * />
 *
 * // Vídeo responsivo com aspect ratio
 * <VideoPlayer
 *   src="https://example.com/video.mp4"
 *   aspectRatio="16/9"
 *   controls={true}
 *   autoPlay={false}
 * />
 *
 * // Vídeo com callbacks
 * <VideoPlayer
 *   src="/videos/presentation.mp4"
 *   onPlay={() => console.log("Video started")}
 *   onEnded={() => console.log("Video finished")}
 * />
 * ```
 */
const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      src,
      poster,
      title,
      description,
      autoPlay = false,
      controls = true,
      loop = false,
      muted = false,
      preload = "metadata",
      width,
      height,
      aspectRatio = "16/9",
      className,
      onPlay,
      onPause,
      onEnded,
      onError,
      lazy = true,
      fallbackText = "Seu navegador não suporta reprodução de vídeo.",
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = React.useState(!lazy);
    const [hasError, setHasError] = React.useState(false);
    const [isIntersecting, setIsIntersecting] = React.useState(!lazy);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLVideoElement) => {
        if (ref) {
          if (typeof ref === "function") {
            ref(node);
          } else {
            ref.current = node;
          }
        }
        videoRef.current = node;
      },
      [ref]
    );

    // Intersection Observer para lazy loading
    React.useEffect(() => {
      if (!lazy || !containerRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            setIsLoaded(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        }
      );

      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, [lazy]);

    // Event handlers
    const handlePlay = React.useCallback(() => {
      onPlay?.();
    }, [onPlay]);

    const handlePause = React.useCallback(() => {
      onPause?.();
    }, [onPause]);

    const handleEnded = React.useCallback(() => {
      onEnded?.();
    }, [onEnded]);

    const handleError = React.useCallback(
      (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        setHasError(true);
        onError?.(event.nativeEvent);
      },
      [onError]
    );

    const handleLoadedData = React.useCallback(() => {
      setHasError(false);
    }, []);

    // Get aspect ratio styles
    const aspectRatioStyle = React.useMemo(() => {
      if (width && height) return {};

      const ratioMap: Record<string, string> = {
        "16/9": "56.25%",
        "4/3": "75%",
        "1/1": "100%",
        "21/9": "42.86%",
      };

      const paddingBottom = ratioMap[aspectRatio] || aspectRatio;

      return {
        paddingBottom,
        position: "relative" as const,
        width: "100%",
        height: 0,
      };
    }, [aspectRatio, width, height]);

    const videoStyle = React.useMemo(() => {
      if (width && height) {
        return { width, height };
      }

      return {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      };
    }, [width, height]);

    // Loading placeholder
    const LoadingPlaceholder = () => (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-600",
          width && height ? "" : "absolute inset-0"
        )}
        style={width && height ? { width, height } : {}}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Carregando vídeo...</p>
        </div>
      </div>
    );

    // Error placeholder
    const ErrorPlaceholder = () => (
      <div
        className={cn(
          "flex items-center justify-center bg-red-50 text-red-600 border border-red-200 rounded",
          width && height ? "" : "absolute inset-0"
        )}
        style={width && height ? { width, height } : {}}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium">Erro ao carregar vídeo</p>
          <p className="text-xs text-red-500 mt-1">{fallbackText}</p>
        </div>
      </div>
    );

    return (
      <div
        ref={containerRef}
        className={cn("overflow-hidden rounded-lg", className)}
        style={aspectRatioStyle}
        {...props}
      >
        {!isLoaded && <LoadingPlaceholder />}

        {hasError && <ErrorPlaceholder />}

        {isLoaded && !hasError && (
          <video
            ref={combinedRef}
            src={isIntersecting ? src : undefined}
            poster={poster}
            title={title}
            autoPlay={autoPlay}
            controls={controls}
            loop={loop}
            muted={muted}
            preload={preload}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            onLoadedData={handleLoadedData}
            style={videoStyle}
            className="object-cover"
          >
            {fallbackText}
          </video>
        )}

        {description && (
          <div className="mt-2 text-sm text-gray-600">{description}</div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;

// Export de tipos para TypeScript
export type { VideoPlayerProps };
