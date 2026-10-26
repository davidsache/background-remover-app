# Client-Side Background Remover

A privacy-first, client-side web application for automated image background removal. 
Inference runs entirely within the user's browser using WebAssembly (WASM) and Web Workers, 
eliminating the need for remote API calls, backend servers, or data transmission.

## Key Features
- **100% Client-Side Processing:** Zero server costs; image data never leaves the local environment.
- **WASM Acceleration:** Multi-threaded neural network inference via `@imgly/background-removal`.
- **Zero Configuration:** Drag-and-drop interface with real-time inference progress tracking.
- **Export Capabilities:** Direct PNG export with preserved alpha channel transparency.
- **Stack:** React 18, Vite, Tailwind CSS, Lucide Icons.
