import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Carregar variáveis de ambiente
config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');
  
  // Debug: verificar todas as variáveis de ambiente
  console.log('🔍 Variáveis de ambiente disponíveis:');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
  console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '***CONFIGURADO***' : 'NÃO CONFIGURADO');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  // Obter credenciais do ambiente ou usar valores padrão temporariamente
  const adminEmail = process.env.ADMIN_EMAIL || "guilherme..emannuel05@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Gui#14042005";

  console.log(`📧 Usando email: ${adminEmail}`);
  console.log(`🔑 Senha configurada: ${adminPassword ? 'SIM' : 'NÃO'}`);

  if (!adminEmail || !adminPassword) {
    console.error('❌ ADMIN_EMAIL ou ADMIN_PASSWORD não encontrados nas variáveis de ambiente');
    console.error('❌ Verifique se o arquivo .env existe e contém as variáveis necessárias');
    throw new Error('Credenciais de admin não configuradas');
  }

  console.log(`📧 Criando usuário admin com email: ${adminEmail}`);

  // Gerar hash da senha
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
  
  console.log('🔐 Hash da senha gerado com sucesso');

  // Criar usuário admin
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuário admin criado com sucesso!');
  console.log(`👤 ID: ${adminUser.id}`);
  console.log(`📧 Email: ${adminUser.email}`);
  console.log(`🔑 Role: ${adminUser.role}`);

  // Criar módulos padrão se não existirem
  const defaultModules = [
    { name: 'Trabalho', slug: 'trabalho', order: 1 },
    { name: 'Faculdade', slug: 'faculdade', order: 2 },
    { name: 'Pessoal', slug: 'pessoal', order: 3 },
    { name: 'Saúde', slug: 'saude', order: 4 },
  ];

  for (const module of defaultModules) {
    await prisma.module.upsert({
      where: { slug: module.slug },
      update: { name: module.name, order: module.order },
      create: {
        name: module.name,
        slug: module.slug,
        order: module.order,
      },
    });
  }

  console.log('📁 Módulos padrão criados com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('🎉 Seed concluído com sucesso!');
  })
  .catch(async (e) => {
    console.error('❌ Erro durante o seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
