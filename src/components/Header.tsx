export const Header: React.FC = () => {
  return (
    <header className="max-w-4xl w-full mb-4 text-center">
      <h1 className="text-3-xl font-bold tracking-tight">Client-Side Background Remover</h1>
      <p className="text-neutral-400 mt-2 text-sm">
        In-browser inference using WebAssembly. No data uploaded to external servers.
      </p>
    </header>
  );
}