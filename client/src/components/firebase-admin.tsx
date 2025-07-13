import { useState, useCallback } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addHymn } from '@/lib/firebaseService';
import { organs } from '@/lib/organs';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { safeGetElement, safeDispatchEvent } from '@/lib/dom-utils';
import { SafeSelect, SafeSelectItem } from '@/components/ui/safe-select';
import { Progress } from '@/components/ui/progress';
import { ProtectedForm } from '@/components/protected-form';

export default function FirebaseAdmin() {
  const [titulo, setTitulo] = useState('');
  const [orgao, setOrgao] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const { toast } = useToast();

  // Protected callback for organ selection to avoid DOM errors
  const handleOrgaoChange = React.useCallback((value: string) => {
    try {
      setOrgao(value);
    } catch (error) {
      // Silently handle state update errors
      console.warn('Organ selection error:', error);
    }
  }, []);

  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('audio/')) {
          toast({
            title: "Erro",
            description: "Por favor, selecione um arquivo de áudio válido.",
            variant: "destructive",
          });
          return;
        }

        // Validate file size (10MB limit)
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "Arquivo muito grande",
            description: `O arquivo deve ter no máximo ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB. Arquivo atual: ${Math.round(file.size / (1024 * 1024))}MB`,
            variant: "destructive",
          });
          return;
        }

        setAudioFile(file);
        setUploadProgress(0);
        setUploadStatus('');
      }
    } catch (error) {
      console.warn('File change error:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo selecionado.",
        variant: "destructive",
      });
    }
  }, [toast, MAX_FILE_SIZE]);

  const handleSubmit = React.useCallback(async (event: React.FormEvent) => {
    try {
      event.preventDefault();
    } catch (error) {
      console.warn('Form submit prevent default error:', error);
    }
    
    if (!titulo || !orgao || !audioFile) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Iniciando upload...');
    
    try {
      const progressCallback = (progress: number, status: string) => {
        setUploadProgress(progress);
        setUploadStatus(status);
      };

      const docId = await addHymn(titulo, orgao, audioFile, progressCallback);
      
      setUploadProgress(100);
      setUploadStatus('Upload concluído!');
      
      // Success toast - immediate feedback
      toast({
        title: "Sucesso",
        description: "Hino adicionado com sucesso!",
      });
      
      // Reset form state with minimal delay to prevent React conflict
      setTimeout(() => {
        setTitulo('');
        setOrgao('');
        setAudioFile(null);
        setUploadProgress(0);
        setUploadStatus('');
      }, 50);
      
      // Reset file input safely
      setTimeout(() => {
        try {
          const fileInput = safeGetElement('audioFile') as HTMLInputElement;
          if (fileInput && fileInput.parentNode) {
            fileInput.value = '';
          }
        } catch (error) {
          console.warn('File input reset error:', error);
        }
      }, 100);
      
      // Trigger refresh event to update hymn list
      setTimeout(() => {
        try {
          safeDispatchEvent('hymn-added', { docId, orgao });
        } catch (error) {
          console.warn('Event dispatch error:', error);
        }
      }, 150);
      
    } catch (error: any) {
      console.error('Error adding hymn:', error);
      setUploadProgress(0);
      setUploadStatus('');
      
      toast({
        title: "Erro",
        description:
          typeof error?.message === 'string'
            ? error.message
            : 'Erro ao adicionar hino. Verifique sua conexão e tente novamente.',
        variant: "destructive",
      });
    } finally {
      // Reset uploading state 
      setIsUploading(false);
    }
  }, [titulo, orgao, audioFile, toast]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-church-primary">Adicionar Hino</CardTitle>
      </CardHeader>
      <CardContent>
        <ProtectedForm onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título do Hino</Label>
            <Input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => {
                try {
                  setTitulo(e.target.value);
                } catch (error) {
                  console.warn('Title change error:', error);
                }
              }}
              placeholder="Digite o título do hino"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="orgao">Órgão</Label>
            <SafeSelect value={orgao} onValueChange={handleOrgaoChange} placeholder="Selecione o órgão">
              {organs.map((organ) => (
                <SafeSelectItem key={organ.key} value={organ.name}>
                  {organ.name}
                </SafeSelectItem>
              ))}
            </SafeSelect>
          </div>
          
          <div>
            <Label htmlFor="audioFile">Arquivo de Áudio</Label>
            <Input
              id="audioFile"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              required
            />
            {audioFile && (
              <div className="mt-1">
                <p className="text-sm text-gray-600">
                  Arquivo selecionado: {audioFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  Tamanho: {Math.round(audioFile.size / (1024 * 1024) * 100) / 100}MB
                </p>
              </div>
            )}
            
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-church-primary" />
                  <span className="text-sm text-gray-600">{uploadStatus}</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(uploadProgress)}% concluído
                </p>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-church-primary hover:bg-church-secondary"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Adicionar Hino
              </>
            )}
          </Button>
        </ProtectedForm>
      </CardContent>
    </Card>
  );
}