import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n.tsx';
import * as ort from 'onnxruntime-web';
import App from './App.tsx';

if (typeof window !== 'undefined') {
  const JSEP_WASM_PATH = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';

  Object.defineProperty(ort.env.wasm, 'wasmPaths', {
    get() {
      return JSEP_WASM_PATH;
    },
    set(_value) {
      // Absorb assignments from @imgly to prevent strict-mode TypeError
    },
    configurable: true,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
