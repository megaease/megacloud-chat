import { create } from 'zustand';
import type { StreamDelta } from '@/types/stream-delta';

export interface Artifact {
  documentId: string;
  title: string;
  kind: 'text' | 'code' | 'sheet' | 'image';
  language?: string;
  content: string;
  status: 'streaming' | 'idle' | 'error' | 'loading';
  isVisible: boolean;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export const initialArtifactData: Artifact = {
  documentId: '',
  title: '',
  kind: 'text',
  content: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 520,
    height: 360,
  },
};

interface ArtifactStore {
  artifact: Artifact;
  metadata: Record<string, unknown>;
  setArtifact: (updater: (draft: Artifact) => Artifact) => void;
  setMetadata: (metadata: Record<string, unknown>) => void;
  resetArtifact: () => void;
}

export const useArtifact = create<ArtifactStore>()((set) => ({
  artifact: initialArtifactData,
  metadata: {},
  setArtifact: (updater) =>
    set((state) => ({
      artifact: updater(state.artifact),
    })),
  setMetadata: (metadata) =>
    set((state) => ({
      metadata,
    })),
  resetArtifact: () =>
    set({
      artifact: initialArtifactData,
      metadata: {},
    }),
}));
