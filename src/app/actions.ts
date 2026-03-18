// src/app/actions.ts
'use server'
import { prisma } from "@/lib/prisma" // sua instância do prisma

export async function getData() {
  return await prisma.module.findMany()
}