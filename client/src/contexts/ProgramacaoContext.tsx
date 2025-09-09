import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ProgramItem {
  organKey: string;
  hymnIndex: number;
  titulo: string;
}

interface ProgramacaoContextType {
  programacao: ProgramItem[];
  addItem: (item: ProgramItem) => void;
  removeItem: (organKey: string, hymnIndex: number) => void;
  toggleItem: (item: ProgramItem) => void;
  isProgrammed: (organKey: string, hymnIndex: number) => boolean;
}

const ProgramacaoContext = createContext<ProgramacaoContextType | undefined>(undefined);

const STORAGE_KEY = 'programacao';

export function ProgramacaoProvider({ children }: { children: React.ReactNode }) {
  const [programacao, setProgramacao] = useState<ProgramItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgramacao(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Erro ao carregar programacao do localStorage', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(programacao));
    } catch (err) {
      console.error('Erro ao salvar programacao no localStorage', err);
    }
  }, [programacao]);

  const addItem = (item: ProgramItem) => {
    setProgramacao(prev => {
      if (prev.some(p => p.organKey === item.organKey && p.hymnIndex === item.hymnIndex)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeItem = (organKey: string, hymnIndex: number) => {
    setProgramacao(prev => prev.filter(p => !(p.organKey === organKey && p.hymnIndex === hymnIndex)));
  };

  const toggleItem = (item: ProgramItem) => {
    setProgramacao(prev => {
      const exists = prev.some(p => p.organKey === item.organKey && p.hymnIndex === item.hymnIndex);
      if (exists) {
        return prev.filter(p => !(p.organKey === item.organKey && p.hymnIndex === item.hymnIndex));
      }
      return [...prev, item];
    });
  };

  const isProgrammed = (organKey: string, hymnIndex: number) => {
    return programacao.some(p => p.organKey === organKey && p.hymnIndex === hymnIndex);
  };

  return (
    <ProgramacaoContext.Provider value={{ programacao, addItem, removeItem, toggleItem, isProgrammed }}>
      {children}
    </ProgramacaoContext.Provider>
  );
}

export function useProgramacao() {
  const context = useContext(ProgramacaoContext);
  if (!context) {
    throw new Error('useProgramacao must be used within a ProgramacaoProvider');
  }
  return context;
}

