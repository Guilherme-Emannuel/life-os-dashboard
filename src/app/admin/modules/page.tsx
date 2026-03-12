"use server";

import { prisma } from "@/lib/prisma";
import { ensureDefaultModules } from "@/lib/modules";
import { revalidatePath } from "next/cache";

async function getAllModules() {
  await ensureDefaultModules();
  return prisma.module.findMany({
    orderBy: { order: "asc" },
  });
}

async function updateModule(formData: FormData) {
  "use server";
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

async function createModule(formData: FormData) {
  "use server";
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

async function deleteModule(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;

  await prisma.module.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/modules");
}

export default async function ModulesAdminPage() {
  const modules = await getAllModules();

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-zinc-950 px-4 py-8 text-zinc-100">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            Gerenciar módulos
          </h1>
          <p className="text-xs text-zinc-500">
            Renomeie, oculte, exclua ou crie novas abas para o seu Life OS.
          </p>
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Módulos existentes
        </h2>
        <div className="space-y-2 text-xs">
          {modules.map((module) => (
            <form
              key={module.id}
              action={updateModule}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
            >
              <input type="hidden" name="id" value={module.id} />
              <input
                name="name"
                defaultValue={module.name}
                className="h-7 flex-1 rounded-md border border-zinc-700/70 bg-zinc-950 px-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
              <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={module.isActive}
                  className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-950 text-emerald-500"
                />
                visível
              </label>
              <button
                formAction={deleteModule}
                className="rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/20"
              >
                Excluir
              </button>
              <button
                type="submit"
                className="rounded-md bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                Salvar
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Novo módulo
        </h2>
        <form
          action={createModule}
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs"
        >
          <input
            name="name"
            placeholder="Ex.: Saúde, Projetos, Família..."
            className="h-7 flex-1 rounded-md border border-zinc-700/70 bg-zinc-950 px-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400"
          >
            Adicionar
          </button>
        </form>
      </section>
    </div>
  );
}

