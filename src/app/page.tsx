import { getModules } from "@/lib/module-actions";
import { hasCriticalOpenEventsToday } from "@/lib/events";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

async function getDayProgress() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const ratio = Math.min(Math.max(elapsed / total, 0), 1);
  return Math.round(ratio * 100);
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // O middleware vai redirecionar para o login
    return null;
  }

  const modules = await getModules();
  const [dayProgress, hasCritical] = await Promise.all([
    getDayProgress(),
    hasCriticalOpenEventsToday(),
  ]);

  return (
    <HomeClient 
      modules={modules} 
      dayProgress={dayProgress} 
      hasCritical={hasCritical}
    />
  );
}
