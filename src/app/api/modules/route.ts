import { NextRequest, NextResponse } from "next/server";
import { getModules } from "@/lib/module-actions";

export async function GET(req: NextRequest) {
  try {
    const modules = await getModules();
    console.log("🔍 API GET /modules - Módulos encontrados:", modules.length, modules);
    return NextResponse.json(modules);
  } catch (error: any) {
    console.error("❌ API GET /modules - Erro ao buscar módulos:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao buscar módulos" },
      { status: 400 },
    );
  }
}
