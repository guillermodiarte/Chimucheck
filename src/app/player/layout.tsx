export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500/30 selection:text-yellow-200">
      {children}
    </div>
  );
}
