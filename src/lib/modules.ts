"use server";

import { prisma } from "./prisma";

const DEFAULT_MODULES = [
  { name: "Tarefas", slug: "tarefas", order: 0 },
  { name: "Finanças", slug: "financas", order: 1 },
  { name: "Estudos", slug: "estudos", order: 2 },
  { name: "Lembretes", slug: "lembretes", order: 3 },
];

export async function ensureDefaultModules() {
  const existing = await prisma.module.count();
  if (existing > 0) return;

  await prisma.module.createMany({
    data: DEFAULT_MODULES.map((m) => ({
      name: m.name,
      slug: m.slug,
      order: m.order,
      isActive: true,
    })),
  });
}

export async function getActiveModules() {
  await ensureDefaultModules();
  return prisma.module.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

