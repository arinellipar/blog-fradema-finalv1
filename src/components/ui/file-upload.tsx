// src/components/ui/file-upload.tsx - Componente reutilizável para upload

"use client";

import * as React from "react";
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Interface para arquivo uploadado
export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
}

// Props do componente
export interface FileUploadProps {
  /**
   * Callback executado quando arquivos são enviados com sucesso
   */
  onFilesUploaded?: (files: UploadedFile[]) => void;

  /**
   * Callback executado quando um arquivo é removido
   */
  onFileRemoved?: (filename: string) => void;

  /**
   * Permite múltiplos arquivos
   * @default true
   */
  multiple?: boolean;

  /**
   * Tipos de arquivo aceitos
   * @default ['image/*', '.pdf', '.doc', '.docx', '.txt']
   */
  acceptedTypes?: string[];

  /**
   * Tamanho máximo por arquivo em bytes
   * @default 10MB
   */
  maxFileSize?: number;

  /**
   * Número máximo de arquivos
   * @default 10
   */
  maxFiles?: number;

  /**
   * Arquivos já enviados (para modo controlado)
   */
  files?: UploadedFile[];

  /**
   * Estado de loading externo
   */
  isLoading?: boolean;

  /**
   * Classes CSS customizadas
   */
  className?: string;

  /**
   * Texto customizado
   */
  texts?: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
  };

  /**
   * Mostrar preview de imagens
   * @default true
   */
  showPreview?: boolean;

  /**
   * Permitir definir imagem principal
   * @default false
   */
  allowSetMainImage?: boolean;

  /**
   * Callback para definir imagem principal
   */
  onSetMainImage?: (url: string) => void;

  /**
   * URL da imagem principal atual
   */
  mainImageUrl?: string;
}

// Hook para upload de arquivos
export const useFileUpload = () => {
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
    setUploading(true);
    setUploadProgress(0);

    const uploadedFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Progress baseado no arquivo atual
        const baseProgress = (i / files.length) * 100;
        setUploadProgress(baseProgress);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro no upload de ${file.name}`);
        }

        const result = await response.json();
        uploadedFiles.push(result);

        // Progress do arquivo atual
        setUploadProgress(baseProgress + ((i + 1) / files.length) * 100);
      }

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);

      return uploadedFiles;
    } catch (error) {
      setUploadProgress(0);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading, uploadProgress };
};

// Componente principal
export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      onFilesUploaded,
      onFileRemoved,
      multiple = true,
      acceptedTypes = ["image/*", ".pdf", ".doc", ".docx", ".txt"],
      maxFileSize = 10 * 1024 * 1024, // 10MB
      maxFiles = 10,
      files = [],
      isLoading = false,
      className,
      texts = {},
      showPreview = true,
      allowSetMainImage = false,
      onSetMainImage,
      mainImageUrl,
    },
    ref
  ) => {
    const { uploadFiles, uploading, uploadProgress } = useFileUpload();
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Textos padrão
    const defaultTexts = {
      title: "Anexar arquivos",
      subtitle: `Arraste arquivos aqui ou clique para selecionar (até ${Math.round(
        maxFileSize / (1024 * 1024)
      )}MB por arquivo)`,
      buttonText: "Selecionar arquivos",
    };

    const finalTexts = { ...defaultTexts, ...texts };

    // Validar arquivo
    const validateFile = (file: File): { valid: boolean; error?: string } => {
      if (file.size > maxFileSize) {
        return {
          valid: false,
          error: `Arquivo muito grande. Máximo: ${Math.round(
            maxFileSize / (1024 * 1024)
          )}MB`,
        };
      }

      return { valid: true };
    };

    // Handler para seleção de arquivos
    const handleFileSelect = async (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      const fileArray = Array.from(selectedFiles);

      // Verificar limite de arquivos
      if (files.length + fileArray.length > maxFiles) {
        alert(`Máximo de ${maxFiles} arquivos permitidos`);
        return;
      }

      // Validar arquivos
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      try {
        const uploadedFiles = await uploadFiles(validFiles);
        onFilesUploaded?.(uploadedFiles);
      } catch (error) {
        console.error("Erro no upload:", error);
        alert(error instanceof Error ? error.message : "Erro no upload");
      }

      // Limpar input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    // Drag and drop handlers
    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files);
      }
    };

    // Formatar tamanho do arquivo
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Obter ícone do arquivo
    const getFileIcon = (type: string) => {
      if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
      if (type === "application/pdf")
        return <File className="w-4 h-4 text-red-500" />;
      return <FileText className="w-4 h-4" />;
    };

    const loading = isLoading || uploading;

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        {/* Área de Upload */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            loading && "opacity-50 pointer-events-none"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            {loading ? (
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
            )}

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {finalTexts.title}
            </h3>

            <p className="text-gray-600 mb-4 max-w-sm">{finalTexts.subtitle}</p>

            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
              accept={acceptedTypes.join(",")}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              disabled={loading}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {loading ? "Enviando..." : finalTexts.buttonText}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Enviando arquivos...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de Arquivos */}
        {files.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">
                Arquivos ({files.length}
                {maxFiles > 1 && `/${maxFiles}`})
              </h4>

              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.filename}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {/* Preview ou ícone */}
                    <div className="flex-shrink-0">
                      {showPreview && file.type.startsWith("image/") ? (
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          {getFileIcon(file.type)}
                        </div>
                      )}
                    </div>

                    {/* Info do arquivo */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      {allowSetMainImage && file.type.startsWith("image/") && (
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            mainImageUrl === file.url ? "default" : "outline"
                          }
                          onClick={() => onSetMainImage?.(file.url)}
                          className="text-xs"
                        >
                          {mainImageUrl === file.url ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Principal
                            </>
                          ) : (
                            "Definir como principal"
                          )}
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onFileRemoved?.(file.filename)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

// Componente simplificado para upload de imagem única
export const ImageUpload = React.forwardRef<
  HTMLDivElement,
  {
    onImageUploaded?: (file: UploadedFile) => void;
    onImageRemoved?: () => void;
    imageUrl?: string;
    className?: string;
    maxSize?: number;
  }
>(
  (
    {
      onImageUploaded,
      onImageRemoved,
      imageUrl,
      className,
      maxSize = 5 * 1024 * 1024,
    },
    ref
  ) => {
    const [file, setFile] = React.useState<UploadedFile | null>(null);

    React.useEffect(() => {
      if (imageUrl && !file) {
        // Se temos URL mas não arquivo, criar um objeto file mock
        setFile({
          filename: "current-image",
          originalName: "Imagem atual",
          size: 0,
          type: "image/jpeg",
          url: imageUrl,
        });
      }
    }, [imageUrl, file]);

    return (
      <FileUpload
        ref={ref}
        multiple={false}
        acceptedTypes={["image/*"]}
        maxFileSize={maxSize}
        maxFiles={1}
        files={file ? [file] : []}
        onFilesUploaded={(files) => {
          const uploadedFile = files[0];
          setFile(uploadedFile);
          onImageUploaded?.(uploadedFile);
        }}
        onFileRemoved={() => {
          setFile(null);
          onImageRemoved?.();
        }}
        className={className}
        texts={{
          title: "Adicionar imagem",
          subtitle: `JPG, PNG ou WebP até ${Math.round(
            maxSize / (1024 * 1024)
          )}MB`,
          buttonText: "Selecionar imagem",
        }}
        showPreview={true}
      />
    );
  }
);

ImageUpload.displayName = "ImageUpload";
