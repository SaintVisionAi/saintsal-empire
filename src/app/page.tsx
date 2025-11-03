export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-gold">SaintSal™</h1>
        <p className="text-xl mb-8">IQ 157 Intelligence Platform | HACP™ Protected</p>
        <div className="space-x-4">
          <a href="/auth/signup" className="bg-gold text-black px-6 py-3 rounded font-bold">Get Started</a>
          <a href="/auth/login" className="border border-gold text-gold px-6 py-3 rounded">Login</a>
        </div>
        <p className="text-sm mt-4 text-gray-400">Patent 10,290,222 | Free Limited Account</p>
      </div>
    </div>
  );
}
