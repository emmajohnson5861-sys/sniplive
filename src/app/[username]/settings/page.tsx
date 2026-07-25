'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSettingsStore } from '@/store/settings-store';
import styles from './page.module.css';

export default function EditorSettingsPage() {
  const { theme, toggleTheme } = useTheme();
  
  const { 
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    lineHeight, setLineHeight,
    autoSave, setAutoSave,
    showLineNumbers, setShowLineNumbers,
    bracketPairing, setBracketPairing,
    tabSize, setTabSize
  } = useSettingsStore();

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Editor Appearance</h2>
          <p className={styles.sectionDesc}>Customize how the editor looks and feels.</p>
        </div>

        <div className={styles.grid}>
          {/* Theme Selection */}
          <div>
            <label className={styles.label}>Editor Theme</label>
            <div className={styles.themeGrid}>
              <div 
                className={`${styles.themeCard} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
              >
                <div className={`${styles.themePreview} ${styles.themePreviewDark}`}>
                  <span className={`material-symbols-outlined ${styles.themeCardIcon}`}>dark_mode</span>
                </div>
                <span className={styles.themeCardLabel}>Dark</span>
              </div>
              <div 
                className={`${styles.themeCard} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
              >
                <div className={`${styles.themePreview} ${styles.themePreviewLight}`}>
                  <span className={`material-symbols-outlined ${styles.themeCardIcon}`} style={{ color: 'black' }}>light_mode</span>
                </div>
                <span className={styles.themeCardLabel}>Light</span>
              </div>
              <div className={styles.themeCard} style={{ cursor: 'not-allowed' }}>
                <div className={`${styles.themePreview} ${styles.themePreviewSystem}`}>
                  <span className={`material-symbols-outlined ${styles.themeCardIcon}`}>hdr_strong</span>
                </div>
                <span className={styles.themeCardLabel}>System</span>
              </div>
            </div>
          </div>

          {/* Typography Section */}
          <div className={styles.typoBox}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Font Family</label>
              <select 
                className={styles.select} 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Source Code Pro">Source Code Pro</option>
                <option value="Geist Mono">Geist Mono</option>
              </select>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Font Size</label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="number" 
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min="10"
                    max="32"
                  />
                  <span>px</span>
                </div>
              </div>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Line Height</label>
                <input 
                  type="number" 
                  step="0.1"
                  className={styles.input}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  min="1"
                  max="3"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Editor Behavior</h2>
          <p className={styles.sectionDesc}>Control interaction and automated features.</p>
        </div>

        <div className={styles.listGroup}>
          <div className={styles.listItem}>
            <div>
              <p className={styles.itemTitle}>Auto-save changes</p>
              <p className={styles.itemDesc}>Automatically save snippets as you type.</p>
            </div>
            <label className={styles.toggleSwitch}>
              <input 
                type="checkbox" 
                className={styles.toggleInput} 
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              <div className={styles.toggleSlider}></div>
            </label>
          </div>

          <div className={styles.listItem}>
            <div>
              <p className={styles.itemTitle}>Show Line Numbers</p>
              <p className={styles.itemDesc}>Render a gutter with line counts.</p>
            </div>
            <label className={styles.toggleSwitch}>
              <input 
                type="checkbox" 
                className={styles.toggleInput} 
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
              />
              <div className={styles.toggleSlider}></div>
            </label>
          </div>

          <div className={styles.listItem}>
            <div>
              <p className={styles.itemTitle}>Bracket Pairing</p>
              <p className={styles.itemDesc}>Highlight corresponding opening/closing brackets.</p>
            </div>
            <label className={styles.toggleSwitch}>
              <input 
                type="checkbox" 
                className={styles.toggleInput} 
                checked={bracketPairing}
                onChange={(e) => setBracketPairing(e.target.checked)}
              />
              <div className={styles.toggleSlider}></div>
            </label>
          </div>

          <div className={styles.listItem}>
            <div>
              <p className={styles.itemTitle}>Tab Size</p>
              <p className={styles.itemDesc}>The number of spaces a tab is equal to.</p>
            </div>
            <div className={styles.segmentControl}>
              {[2, 4, 8].map(size => (
                <button
                  key={size}
                  className={`${styles.segmentBtn} ${tabSize === size ? styles.active : ''}`}
                  onClick={() => setTabSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.previewSection}`}>
        <h3 className={styles.label}>Preview</h3>
        <div 
          className={styles.previewContainer} 
          style={{ 
            fontFamily: fontFamily === 'Geist Mono' ? 'var(--font-mono)' : `'${fontFamily}', monospace`, 
            fontSize: `${fontSize}px`, 
            lineHeight: lineHeight,
            backgroundColor: theme === 'light' ? '#f5f5f5' : 'var(--surface-dim)',
            color: theme === 'light' ? '#333' : 'var(--text-primary)'
          }}
        >
          <div className={styles.windowControls}>
            <div className={`${styles.windowDot} ${styles.dotError}`}></div>
            <div className={`${styles.windowDot} ${styles.dotWarning}`}></div>
            <div className={`${styles.windowDot} ${styles.dotSuccess}`}></div>
          </div>
          
          <div className={styles.previewLayout}>
            {showLineNumbers && (
              <div className={styles.lineNumbers}>
                1<br/>2<br/>3<br/>4<br/>5
              </div>
            )}
            <div className={styles.codeContent}>
              <p><span style={{ color: 'var(--primary)' }}>function</span> <span style={{ color: 'var(--secondary-fixed)' }}>calculateEfficiency</span>(data) {'{'}</p>
              <p style={{ marginLeft: `${tabSize * 8}px` }}><span style={{ color: 'var(--primary)' }}>const</span> result = data.<span style={{ color: 'var(--secondary-fixed)' }}>reduce</span>((acc, val) =&gt; {'{'}</p>
              <p style={{ marginLeft: `${tabSize * 16}px` }}><span style={{ color: 'var(--primary)' }}>return</span> acc + (val * <span style={{ color: 'var(--success)' }}>1.5</span>);</p>
              <p style={{ marginLeft: `${tabSize * 8}px` }}>{'}'}, <span style={{ color: 'var(--success)' }}>0</span>);</p>
              <p style={{ marginLeft: `${tabSize * 8}px` }}><span style={{ color: 'var(--primary)' }}>return</span> result.toFixed(<span style={{ color: 'var(--success)' }}>2</span>);</p>
              <p>{'}'}</p>
            </div>
          </div>
        </div>
        <p className={styles.previewCaption}>Live preview of current font and theme settings.</p>
      </section>
    </>
  );
}
