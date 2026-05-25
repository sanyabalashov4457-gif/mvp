import { AppShell } from "@/components/AppShell";
import { FavoritesClient } from "@/components/FavoritesClient";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function FavoritesPage() {
  return (
    <AppShell>
      <Header
        title="Сохраненные находки"
        subtitle="Вещи, которым ты захотел дать вторую жизнь."
      />
      <FavoritesClient />
    </AppShell>
  );
}
