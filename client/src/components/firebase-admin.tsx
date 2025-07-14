import { useState, useCallback } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSafeToast } from '@/components/safe-toast-provider';
import { addHymn } from '@/lib/firebaseService';
import { organs } from '@/lib/organs';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
// Using native select to avoid DOM manipulation issues
import { Progress } from '@/components/ui/progress';
// Simplified imports - removed DOM utilities that cause conflicts

export default function FirebaseAdmin() {
  const [titulo, setTitulo] = useState('');
  const [orgao, setOrgao] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const { showToast } = useSafeToast();

  // Remove unused callback since we're using native select

  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('audio/')) {
          showToast({
            title: "Erro",
            description: "Por favor, selecione um arquivo de áudio válido.",
            variant: "destructive",
          });
          return;
        }

        // Validate file size (10MB limit)
        if (file.size > MAX_FILE_SIZE) {
          showToast({
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
      showToast({
        title: "Erro",
        description: "Erro ao processar o arquivo selecionado.",
        variant: "destructive",
      });
    }
  }, [showToast, MAX_FILE_SIZE]);

  const handleSubmit = React.useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation - check required fields first
    if (!titulo || !orgao || !audioFile) {
      showToast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent upload if already uploading
    if (isUploading) {
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
      
      // Success toast 
      showToast({
        title: "Sucesso",
        description: "Hino adicionado com sucesso!",
      });
      
      // Reset form state cleanly
      setTitulo('');
      setOrgao('');
      setAudioFile(null);
      setUploadProgress(0);
      setUploadStatus('');
      
      // Reset file input safely
      try {
        const fileInput = document.getElementById('audioFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        console.warn('File input reset error:', error);
      }
      
      // Trigger refresh event safely with timeout 
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('hymn-added', { detail: { docId, orgao } }));
        } catch (error) {
          console.warn('Event dispatch error:', error);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Error adding hymn:', error);
      setUploadProgress(0);
      setUploadStatus('');
      
      showToast({
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
  }, [titulo, orgao, audioFile, showToast]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-church-primary">Adicionar Hino</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título do Hino</Label>
            <Input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título do hino"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="orgao">Órgão</Label>
            <select
              value={orgao}
              onChange={(e) => setOrgao(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Selecione o órgão</option>
              {organs.map((organ) => (
                <option key={organ.key} value={organ.name}>
                  {organ.name}
                </option>
              ))}
            </select>
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
        </form>
      </CardContent>
    </Card>
  );
}