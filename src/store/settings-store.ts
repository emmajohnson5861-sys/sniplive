import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  autoSave: boolean;
  showLineNumbers: boolean;
  bracketPairing: boolean;
  tabSize: number;
  
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setAutoSave: (val: boolean) => void;
  setShowLineNumbers: (val: boolean) => void;
  setBracketPairing: (val: boolean) => void;
  setTabSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontFamily: 'JetBrains Mono',
      fontSize: 14,
      lineHeight: 1.6,
      autoSave: true,
      showLineNumbers: true,
      bracketPairing: true,
      tabSize: 2,

      setFontFamily: (font) => set({ fontFamily: font }),
      setFontSize: (size) => set({ fontSize: size }),
      setLineHeight: (height) => set({ lineHeight: height }),
      setAutoSave: (val) => set({ autoSave: val }),
      setShowLineNumbers: (val) => set({ showLineNumbers: val }),
      setBracketPairing: (val) => set({ bracketPairing: val }),
      setTabSize: (size) => set({ tabSize: size }),
    }),
    {
      name: 'sniplive-editor-settings',
    }
  )
);
