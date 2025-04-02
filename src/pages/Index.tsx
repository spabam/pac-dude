
import GameCanvas from '../components/GameCanvas';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <header className="text-center mb-4">
        <h1 className="text-4xl font-pixel text-yellow-400 mb-2">GHOST GOBBLER</h1>
        <p className="text-lg text-blue-400 font-pixel">Classic arcade action for Debian Linux</p>
      </header>
      <main className="w-full flex justify-center">
        <GameCanvas />
      </main>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Use arrow keys to move, space to start/pause</p>
        <p className="mt-2">Created with Lovable ❤️</p>
      </footer>
    </div>
  );
};

export default Index;
