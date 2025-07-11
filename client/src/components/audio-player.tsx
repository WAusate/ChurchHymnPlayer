import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { HymnData } from "@shared/schema";

interface AudioPlayerProps {
  hymn: HymnData;
  onError?: (error: string) => void;
}

export default function AudioPlayer({ hymn, onError }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Check if URL is valid before setting up audio
    if (!hymn.url || hymn.url.trim() === '') {
      setIsLoading(false);
      if (onError) {
        onError("URL do áudio não disponível. Tente sincronizar novamente.");
      }
      return;
    }

    // Only reset state if URL actually changed
    const currentSrc = audio.src;
    const newSrc = hymn.url;
    
    if (currentSrc !== newSrc) {
      console.log('URL changed, resetting audio state');
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Clear any existing error states
      audio.removeAttribute('src');
      audio.load();
      
      // Set the new source with proper CORS handling
      audio.crossOrigin = 'anonymous';
      audio.src = newSrc;
      audio.load(); // Force reload
    }

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      const audioError = audioRef.current?.error;
      console.error('Audio error for URL:', hymn.url, e);
      console.error('Audio error details:', {
        code: audioError?.code,
        message: audioError?.message,
        networkState: audioRef.current?.networkState,
        readyState: audioRef.current?.readyState
      });
      
      setIsLoading(false);
      if (onError) {
        let errorMessage = "Erro ao carregar o áudio. ";
        if (audioError) {
          switch (audioError.code) {
            case 1: // MEDIA_ERR_ABORTED
              errorMessage += "Reprodução abortada pelo usuário.";
              break;
            case 2: // MEDIA_ERR_NETWORK
              errorMessage += "Erro de rede. Verifique sua conexão.";
              break;
            case 3: // MEDIA_ERR_DECODE
              errorMessage += "Erro de decodificação. Arquivo pode estar corrompido.";
              break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              errorMessage += "Formato de arquivo não suportado ou arquivo não encontrado.";
              break;
            default:
              errorMessage += "Erro desconhecido.";
          }
        } else {
          errorMessage += "Verifique se o arquivo existe e se você tem permissão para acessá-lo.";
        }
        onError(errorMessage);
      }
    };

    const handleLoadStart = () => {
      console.log('Audio load started');
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log('Audio can play');
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [hymn.url, onError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Test function to debug audio URL access
  const testAudioUrl = async () => {
    console.log('Testing audio URL access...');
    console.log('URL being tested:', hymn.url);
    try {
      const response = await fetch(hymn.url, { 
        method: 'HEAD',
        mode: 'cors',
        credentials: 'include'
      });
      console.log('URL test response:', response.status, response.statusText);
      console.log('Response headers:', [...response.headers.entries()]);
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Length:', response.headers.get('content-length'));
    } catch (error) {
      console.error('URL test error:', error);
      console.log('Trying without CORS...');
      try {
        const response2 = await fetch(hymn.url, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        console.log('No-CORS test response:', response2.status, response2.type);
      } catch (error2) {
        console.error('No-CORS test also failed:', error2);
      }
    }
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        console.log('Attempting to play audio from URL:', hymn.url);
        console.log('Audio element ready state:', audio.readyState);
        console.log('Audio element network state:', audio.networkState);
        console.log('Audio element error:', audio.error);
        
        // Check if audio is ready to play
        if (audio.readyState < 2) {
          console.log('Audio not ready, waiting for it to load...');
          console.log('Current audio src:', audio.src);
          console.log('Current audio URL:', hymn.url);
          
          // Force reload if src doesn't match
          if (audio.src !== hymn.url) {
            console.log('Audio src mismatch, forcing reload...');
            audio.src = hymn.url;
            audio.load();
          }
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              audio.removeEventListener('canplay', handleCanPlay);
              audio.removeEventListener('error', handleError);
              reject(new Error('Audio load timeout'));
            }, 10000); // 10 second timeout
            
            const handleCanPlay = () => {
              clearTimeout(timeout);
              audio.removeEventListener('canplay', handleCanPlay);
              audio.removeEventListener('error', handleError);
              resolve(true);
            };
            const handleError = (e: Event) => {
              clearTimeout(timeout);
              audio.removeEventListener('canplay', handleCanPlay);
              audio.removeEventListener('error', handleError);
              console.error('Audio load error in promise:', e);
              reject(new Error('Audio failed to load'));
            };
            audio.addEventListener('canplay', handleCanPlay);
            audio.addEventListener('error', handleError);
          });
        }
        
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio player error:', error);
      if (onError) {
        onError(`Erro ao reproduzir o áudio: ${error.message}`);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(duration, audio.currentTime + 10);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Don't render player if no valid URL
  if (!hymn.url || hymn.url.trim() === '') {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-church-primary to-church-secondary p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{hymn.titulo}</h2>
          <p className="text-church-light">
            Áudio não disponível. Tente sincronizar novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-church-primary to-church-secondary p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{hymn.titulo}</h2>
        <p className="text-church-light">
          {isLoading ? "Carregando..." : "Pronto para reproduzir"}
        </p>
      </div>

      <div className="p-8">
        <audio 
          ref={audioRef} 
          preload="metadata"
          crossOrigin="anonymous"
          controls={false}
        >
          Seu navegador não suporta o elemento de áudio.
        </audio>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-church-text mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative">
            <Slider
              value={[progressPercentage]}
              onValueChange={handleSeek}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <Button
            variant="ghost"
            size="lg"
            onClick={skipBackward}
            disabled={isLoading}
            className="text-church-secondary hover:text-church-primary"
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          <Button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="bg-church-primary hover:bg-church-secondary text-white rounded-full w-16 h-16 shadow-lg"
            size="lg"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={skipForward}
            disabled={isLoading}
            className="text-church-secondary hover:text-church-primary"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>

        {/* Debug Test Button */}
        <div className="flex justify-center mb-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={testAudioUrl}
            className="text-xs"
          >
            Testar URL do Áudio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const audio = audioRef.current;
              if (audio) {
                console.log('Audio element state:', {
                  src: audio.src,
                  readyState: audio.readyState,
                  networkState: audio.networkState,
                  error: audio.error,
                  crossOrigin: audio.crossOrigin,
                  currentTime: audio.currentTime,
                  duration: audio.duration
                });
              }
            }}
            className="text-xs"
          >
            Debug Audio
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-church-text"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <div className="w-32">
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <span className="text-xs text-church-text w-8">{volume}%</span>
        </div>
      </div>
    </div>
  );
}
