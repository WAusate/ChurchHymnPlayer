import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addHymn } from '@/lib/firebaseService';
import { organs } from '@/lib/organs';
import { Upload, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FirebaseAdmin() {
  const [titulo, setTitulo] = useState('');
  const [orgao, setOrgao] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de áudio válido.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!titulo || !orgao || !audioFile) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const docId = await addHymn(titulo, orgao, audioFile);
      
      toast({
        title: "Sucesso",
        description: "Hino adicionado com sucesso!",
      });
      
      // Reset form
      setTitulo('');
      setOrgao('');
      setAudioFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('audioFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Trigger a refresh of hymn data in the parent component
      // This will update the hymn list automatically
      window.dispatchEvent(new CustomEvent('hymn-added', { 
        detail: { docId, orgao } 
      }));
      
    } catch (error: any) {
      console.error('Error adding hymn:', error);
      toast({
        title: "Erro",
        description:
          typeof error?.message === 'string'
            ? error.message
            : 'Erro ao adicionar hino. Verifique sua conexão e tente novamente.',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
            <Select value={orgao} onValueChange={setOrgao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o órgão" />
              </SelectTrigger>
              <SelectContent>
                {organs.map((organ) => (
                  <SelectItem key={organ.key} value={organ.name}>
                    {organ.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <p className="text-sm text-gray-600 mt-1">
                Arquivo selecionado: {audioFile.name}
              </p>
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