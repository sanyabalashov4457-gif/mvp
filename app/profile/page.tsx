import { User } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";

export default function ProfilePage() {
  return (
    <AppShell>
      <Header title="Профиль" subtitle="Скоро" />
      <EmptyState
        icon={<User className="h-9 w-9" />}
        title="Профиль в разработке"
        description="Персональные настройки, размеры и уведомления появятся в следующей версии."
      />
    </AppShell>
  );
}
