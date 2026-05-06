//npx tsx src/database/seed.ts

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // const count = await prisma.user.count();
  const countvehicle = await prisma.vehicle.count();

  if (countvehicle > 0) {
    console.log('Seed ignorado: já existem usuários');
    return;
  }

  // const adminPassword = await hashService.hash('123456');
  // const userPassword = await hashService.hash('123456');

  // await prisma.user.createMany({
  //   data: [
  //     {
  //       name: 'Admin',
  //       email: 'admin@email.com',
  //       password: adminPassword,
  //       role: 'admin',
  //     },
  //     {
  //       name: 'Erick Prado',
  //       email: 'erickprado@email.com',
  //       password: userPassword,
  //       role: 'user',
  //     },
  //   ],
  // });

  await prisma.vehicle.createMany({
    data: [
      {
        userId: '00fc2d32-3075-4880-9dca-790704d6c3da',
        plate: 'QWE1A23',
        brand: 'Honda',
        model: 'Civic',
        version: 'Touring 1.5 Turbo',
        yearManufacture: 2021,
        yearModel: 2022,
        color: 'Preto',
        fuelType: 'FLEX',
        transmission: 'AUTOMATIC',
        mileage: 45200,
        fipeCode: '014082-0',
        fipeValue: 145000,
        marketValue: 138000,
        auctioneer: 'Copart',
        auctionType: 'BANK',
        sourceUrl: 'https://copart.com/lote/123',
        eventDate: new Date(),
        city: 'Campo Grande',
        state: 'MS',
        yardAddress: 'Av. Gury Marques, 5500',
        auctionInitialBid: 85000,
        auctionCurrentBid: 92000,
        status: 'ANALYZING',
        notes: 'Pequenos riscos no para-choque.',
      },

      {
        userId: '00fc2d32-3075-4880-9dca-790704d6c3da',
        plate: 'BRA2B45',
        brand: 'Toyota',
        model: 'Corolla',
        version: 'XEi 2.0',
        yearManufacture: 2020,
        yearModel: 2021,
        color: 'Branco',
        fuelType: 'FLEX',
        transmission: 'CVT',
        mileage: 62000,
        fipeCode: '002184-9',
        fipeValue: 128000,
        marketValue: 124000,
        auctioneer: 'Freitas Leiloeiro',
        auctionType: 'JUDICIAL',
        sourceUrl: 'https://leilao.com/lote/456',
        eventDate: new Date(),
        city: 'Dourados',
        state: 'MS',
        yardAddress: 'Rua Projetada A',
        auctionInitialBid: 72000,
        auctionCurrentBid: 81000,
        status: 'ANALYZING',
        notes: 'Veículo aparentemente íntegro.',
      },

      {
        userId: '00fc2d32-3075-4880-9dca-790704d6c3da',
        plate: 'TES3C67',
        brand: 'Volkswagen',
        model: 'Golf GTI',
        version: '2.0 TSI',
        yearManufacture: 2015,
        yearModel: 2015,
        color: 'Vermelho',
        fuelType: 'GASOLINE',
        transmission: 'AUTOMATIC',
        mileage: 89000,
        fipeCode: '005340-6',
        fipeValue: 115000,
        marketValue: 108000,
        auctioneer: 'Sodré Santoro',
        auctionType: 'EXTRAJUDICIAL',
        sourceUrl: 'https://sodresantoro.com/lote/789',
        eventDate: new Date(),
        city: 'São Paulo',
        state: 'SP',
        yardAddress: 'Rodovia Anhanguera KM 25',
        auctionInitialBid: 65000,
        auctionCurrentBid: 70000,
        status: 'ANALYZING',
        notes: 'Necessário troca dos pneus.',
      },

      {
        userId: '00fc2d32-3075-4880-9dca-790704d6c3da',
        plate: 'FOX4D89',
        brand: 'Ford',
        model: 'Ranger',
        version: 'Limited 3.2',
        yearManufacture: 2019,
        yearModel: 2020,
        color: 'Prata',
        fuelType: 'DIESEL',
        transmission: 'AUTOMATIC',
        mileage: 71000,
        fipeCode: '003269-7',
        fipeValue: 189000,
        marketValue: 181000,
        auctioneer: 'VIP Leilões',
        auctionType: 'INSURANCE',
        sourceUrl: 'https://vipleiloes.com/lote/101',
        eventDate: new Date(),
        city: 'Cuiabá',
        state: 'MT',
        yardAddress: 'Distrito Industrial',
        auctionInitialBid: 105000,
        auctionCurrentBid: 118000,
        status: 'PURCHASED',
        notes: 'Sinistro leve frontal.',
      },

      {
        userId: '00fc2d32-3075-4880-9dca-790704d6c3da',
        plate: 'BMW5E12',
        brand: 'BMW',
        model: '320i',
        version: 'GP 2.0 Turbo',
        yearManufacture: 2022,
        yearModel: 2023,
        color: 'Azul',
        fuelType: 'FLEX',
        transmission: 'AUTOMATIC',
        mileage: 15000,
        fipeCode: '009876-1',
        fipeValue: 289000,
        marketValue: 280000,
        auctioneer: 'Copart',
        auctionType: 'BANK',
        sourceUrl: 'https://copart.com/lote/555',
        eventDate: new Date(),
        city: 'Curitiba',
        state: 'PR',
        yardAddress: 'Rua Industrial 300',
        auctionInitialBid: 180000,
        auctionCurrentBid: 192000,
        status: 'ANALYZING',
        notes: 'Sem chave.',
      },
    ],
  });

  console.log('Seed executado com sucesso');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
