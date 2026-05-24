import { User } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";

export default function ProfilePage() {
  return (
    <AppShell>
      <Header title="Profile" subtitle="Coming soon" />
      <EmptyState
        icon={<User className="h-9 w-9" />}
        title="Profile is in progress"
        description="Personal cabinets, size preferences and notifications will appear here soon."
      />
    </AppShell>
  );
}
