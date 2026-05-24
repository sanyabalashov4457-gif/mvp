import { AppShell } from "@/components/AppShell";
import { FavoritesClient } from "@/components/FavoritesClient";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function FavoritesPage() {
  return (
    <AppShell>
      <Header
        title="Saved finds"
        subtitle="Pieces you liked enough to give a second life."
      />
      <FavoritesClient />
    </AppShell>
  );
}
