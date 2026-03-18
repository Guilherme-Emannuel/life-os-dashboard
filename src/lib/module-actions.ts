"use server";

import { prisma } from "@/lib/prisma";
import { ensureDefaultModules } from "@/lib/modules";
import { revalidatePath } from "next/cache";

// Server Actions para gerenciamento de módulos
export async function getModules() {
  await ensureDefaultModules();
  const modules = await prisma.module.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  console.log("🔍 getModules - Módulos encontrados:", modules.length, modules);
  return modules;
}

export async function updateModule(id: string, data: { name?: string; isActive?: boolean }) {
  await prisma.module.update({
    where: { id },
    data,
  });

  revalidatePath("/");
  revalidatePath("/admin/modules");
}

export async function createModule(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const maxOrder = await prisma.module.aggregate({
    _max: { order: true },
  });

  console.log("🔍 createModule - Criando módulo:", { name, slug });

  const module = await prisma.module.create({
    data: {
      name,
      slug,
      isActive: true,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  console.log("✅ createModule - Módulo criado:", module);

  revalidatePath("/");
  revalidatePath("/admin/modules");
}

export async function deleteModule(id: string) {
  await prisma.module.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/modules");
}
