"use server";

import { prisma } from "@/lib/prisma";
import { ensureDefaultModules } from "@/lib/modules";
import { revalidatePath } from "next/cache";

// Server Actions para gerenciamento de módulos
export async function getModules() {
  await ensureDefaultModules();
  return prisma.module.findMany({
    orderBy: { order: "asc" },
  });
}

export async function updateModule(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string) ?? "";
  const isActive = formData.get("isActive") === "on";

  await prisma.module.update({
    where: { id },
    data: { name, isActive },
  });

  revalidatePath("/");
  revalidatePath("/admin/modules");
}

export async function createModule(formData: FormData) {
  const name = (formData.get("name") as string) ?? "";
  
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const maxOrder = await prisma.module.aggregate({
    _max: { order: true },
  });

  await prisma.module.create({
    data: {
      name,
      slug,
      isActive: true,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/modules");
}

export async function deleteModule(formData: FormData) {
  const id = formData.get("id") as string;

  await prisma.module.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/modules");
}

export async function getAllModules() {
  await ensureDefaultModules();
  return prisma.module.findMany({
    orderBy: { order: "asc" },
  });
}
