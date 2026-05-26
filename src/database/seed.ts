import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { HashService } from '../common/hash/hash.service';
import {
  AuctionType,
  ChecklistSeverity,
  FuelType,
  Prisma,
  PrismaClient,
  TransmissionType,
  UserRole,
  VehicleDamageType,
  VehicleStatus,
  VehicleType,
} from '../../generated/prisma/client';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed cannot run in production.');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const seedUsers = [
  {
    name: 'Admin',
    email: 'admin@email.com',
    password: '123456',
    role: UserRole.ADMIN,
  },
  {
    name: 'Erick Prado',
    email: 'erickprado@email.com',
    password: '123456',
    role: UserRole.USER,
  },
] satisfies Array<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
}>;

const seedVehicles = [
  {
    plate: 'QWE1A23',
    brand: 'Honda',
    model: 'Civic',
    yearManufacture: 2021,
    yearModel: 2022,
    color: 'Preto',
    fuelType: FuelType.FLEX,
    transmission: TransmissionType.AUTOMATIC,
    type: VehicleType.CAR,
    mileage: 45200,
    fipeCode: '014082-0',
    fipeValue: new Prisma.Decimal('145000.00'),
    marketValue: new Prisma.Decimal('138000.00'),
    auctioneer: 'Copart',
    auctionType: AuctionType.BANK,
    sourceUrl: 'https://copart.com/lote/123',
    eventDate: new Date('2026-05-01T10:00:00.000Z'),
    city: 'Campo Grande',
    state: 'MS',
    yardAddress: 'Av. Gury Marques, 5500',
    auctionInitialBid: new Prisma.Decimal('85000.00'),
    auctionCurrentBid: new Prisma.Decimal('92000.00'),
    damageType: VehicleDamageType.LOW_DAMAGE,
    status: VehicleStatus.ANALYZING,
    notes: 'Pequenos riscos no para-choque.',
  },
  {
    plate: 'BRA2B45',
    brand: 'Toyota',
    model: 'Corolla',
    yearManufacture: 2020,
    yearModel: 2021,
    color: 'Branco',
    fuelType: FuelType.FLEX,
    transmission: TransmissionType.CVT,
    type: VehicleType.CAR,
    mileage: 62000,
    fipeCode: '002184-9',
    fipeValue: new Prisma.Decimal('128000.00'),
    marketValue: new Prisma.Decimal('124000.00'),
    auctioneer: 'Freitas Leiloeiro',
    auctionType: AuctionType.JUDICIAL,
    sourceUrl: 'https://leilao.com/lote/456',
    eventDate: new Date('2026-05-02T10:00:00.000Z'),
    city: 'Dourados',
    state: 'MS',
    yardAddress: 'Rua Projetada A',
    auctionInitialBid: new Prisma.Decimal('72000.00'),
    auctionCurrentBid: new Prisma.Decimal('81000.00'),
    damageType: VehicleDamageType.NONE,
    status: VehicleStatus.ANALYZING,
    notes: 'Veiculo aparentemente integro.',
  },
  {
    plate: 'TES3C67',
    brand: 'Volkswagen',
    model: 'Golf GTI',
    yearManufacture: 2015,
    yearModel: 2015,
    color: 'Vermelho',
    fuelType: FuelType.GASOLINE,
    transmission: TransmissionType.AUTOMATIC,
    type: VehicleType.CAR,
    mileage: 89000,
    fipeCode: '005340-6',
    fipeValue: new Prisma.Decimal('115000.00'),
    marketValue: new Prisma.Decimal('108000.00'),
    auctioneer: 'Sodre Santoro',
    auctionType: AuctionType.EXTRAJUDICIAL,
    sourceUrl: 'https://sodresantoro.com/lote/789',
    eventDate: new Date('2026-05-03T10:00:00.000Z'),
    city: 'Sao Paulo',
    state: 'SP',
    yardAddress: 'Rodovia Anhanguera KM 25',
    auctionInitialBid: new Prisma.Decimal('65000.00'),
    auctionCurrentBid: new Prisma.Decimal('70000.00'),
    damageType: VehicleDamageType.NONE,
    status: VehicleStatus.ANALYZING,
    notes: 'Necessario troca dos pneus.',
  },
  {
    plate: 'FOX4D89',
    brand: 'Ford',
    model: 'Ranger',
    yearManufacture: 2019,
    yearModel: 2020,
    color: 'Prata',
    fuelType: FuelType.DIESEL,
    transmission: TransmissionType.AUTOMATIC,
    type: VehicleType.CAR,
    mileage: 71000,
    fipeCode: '003269-7',
    fipeValue: new Prisma.Decimal('189000.00'),
    marketValue: new Prisma.Decimal('181000.00'),
    auctioneer: 'VIP Leiloes',
    auctionType: AuctionType.INSURANCE,
    sourceUrl: 'https://vipleiloes.com/lote/101',
    eventDate: new Date('2026-05-04T10:00:00.000Z'),
    city: 'Cuiaba',
    state: 'MT',
    yardAddress: 'Distrito Industrial',
    auctionInitialBid: new Prisma.Decimal('105000.00'),
    auctionCurrentBid: new Prisma.Decimal('118000.00'),
    damageType: VehicleDamageType.LOW_DAMAGE,
    status: VehicleStatus.PURCHASED,
    notes: 'Sinistro leve frontal.',
  },
  {
    plate: 'BMW5E12',
    brand: 'BMW',
    model: '320i',
    yearManufacture: 2022,
    yearModel: 2023,
    color: 'Azul',
    fuelType: FuelType.FLEX,
    transmission: TransmissionType.AUTOMATIC,
    type: VehicleType.CAR,
    mileage: 15000,
    fipeCode: '009876-1',
    fipeValue: new Prisma.Decimal('289000.00'),
    marketValue: new Prisma.Decimal('280000.00'),
    auctioneer: 'Copart',
    auctionType: AuctionType.BANK,
    sourceUrl: 'https://copart.com/lote/555',
    eventDate: new Date('2026-05-05T10:00:00.000Z'),
    city: 'Curitiba',
    state: 'PR',
    yardAddress: 'Rua Industrial 300',
    auctionInitialBid: new Prisma.Decimal('180000.00'),
    auctionCurrentBid: new Prisma.Decimal('192000.00'),
    damageType: VehicleDamageType.OTHER,
    status: VehicleStatus.ANALYZING,
    notes: 'Sem chave.',
  },
] satisfies Omit<Prisma.VehicleUncheckedCreateInput, 'userId'>[];

type ChecklistItemSeed = [
  string,
  string,
  string,
  ChecklistSeverity,
  boolean,
  boolean,
  number,
];

const carChecklistItems = [
  [
    'Motor',
    'Compressão / fumaça / sopro',
    '6500.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    10,
  ],
  [
    'Motor',
    'Junta do cabeçote',
    '2400.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    11,
  ],
  [
    'Motor',
    'Vazamentos de óleo e vedações',
    '650.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    12,
  ],
  [
    'Motor',
    'Sistema de arrefecimento',
    '950.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    13,
  ],
  [
    'Motor',
    'Injeção / ignição',
    '850.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    14,
  ],
  [
    'Motor',
    'Coxins do motor',
    '800.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    15,
  ],
  [
    'Transmissão',
    'Kit de embreagem',
    '1100.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    20,
  ],
  [
    'Transmissão',
    'Câmbio manual / automático / CVT',
    '4500.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    21,
  ],
  [
    'Transmissão',
    'Atuador / cabo / hidráulico da embreagem',
    '480.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    22,
  ],
  [
    'Transmissão',
    'Semi-eixos / juntas homocinéticas',
    '950.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    23,
  ],
  [
    'Transmissão',
    'Retentores e vazamentos do câmbio',
    '650.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    24,
  ],
  [
    'Transmissão',
    'Trambulador / alavanca / coxins da caixa',
    '520.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    25,
  ],
  [
    'Pneus',
    'Pneus de rodagem',
    '380.00',
    ChecklistSeverity.HIGH,
    true,
    true,
    30,
  ],
  ['Pneus', 'Estepe', '420.00', ChecklistSeverity.MEDIUM, false, false, 31],
  [
    'Pneus',
    'Rodas / aros',
    '280.00',
    ChecklistSeverity.MEDIUM,
    true,
    false,
    32,
  ],
  ['Pneus', 'Alinhamento', '140.00', ChecklistSeverity.LOW, false, false, 33],
  ['Pneus', 'Balanceamento', '35.00', ChecklistSeverity.LOW, true, false, 34],
  [
    'Pneus',
    'Válvulas / bicos / TPMS',
    '90.00',
    ChecklistSeverity.LOW,
    true,
    false,
    35,
  ],
  [
    'Elétrica',
    'Bateria 12V',
    '680.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    40,
  ],
  [
    'Elétrica',
    'Alternador / carga',
    '850.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    41,
  ],
  [
    'Elétrica',
    'Motor de partida',
    '700.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    42,
  ],
  [
    'Elétrica',
    'Iluminação externa',
    '320.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    43,
  ],
  [
    'Elétrica',
    'Vidros / travas / comandos elétricos',
    '650.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    44,
  ],
  [
    'Elétrica',
    'ECU / chicote / fusíveis / relés',
    '950.00',
    ChecklistSeverity.HIGH,
    false,
    false,
    45,
  ],
  [
    'Lataria',
    'Para-choques e grades',
    '750.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    50,
  ],
  [
    'Lataria',
    'Capô / tampa traseira / fechaduras',
    '850.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    51,
  ],
  [
    'Lataria',
    'Portas / paralamas / caixa de ar',
    '1100.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    52,
  ],
  [
    'Lataria',
    'Para-brisa / vidros fixos',
    '900.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    53,
  ],
  [
    'Lataria',
    'Retrovisores externos',
    '350.00',
    ChecklistSeverity.MEDIUM,
    true,
    true,
    54,
  ],
  [
    'Lataria',
    'Estrutura frontal / traseira / longarinas',
    '4000.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    55,
  ],
  [
    'Interior',
    'Painel / acabamento interno',
    '650.00',
    ChecklistSeverity.LOW,
    false,
    false,
    60,
  ],
  [
    'Interior',
    'Bancos / trilhos / regulagens',
    '700.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    61,
  ],
  [
    'Interior',
    'Forros / vedação / infiltração',
    '750.00',
    ChecklistSeverity.HIGH,
    false,
    false,
    62,
  ],
  [
    'Interior',
    'Ar-condicionado / ventilação',
    '1200.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    63,
  ],
  [
    'Interior',
    'Painel de instrumentos / multimídia',
    '750.00',
    ChecklistSeverity.LOW,
    false,
    false,
    64,
  ],
  [
    'Interior',
    'Chaves / telecomando / miolo',
    '500.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    65,
  ],
  [
    'Suspensão',
    'Amortecedores dianteiros',
    '700.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    70,
  ],
  [
    'Suspensão',
    'Amortecedores traseiros',
    '600.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    71,
  ],
  [
    'Suspensão',
    'Bandejas / pivôs / buchas',
    '900.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    72,
  ],
  [
    'Suspensão',
    'Molas / coxins / batentes',
    '650.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    73,
  ],
  [
    'Suspensão',
    'Caixa / terminais / axiais de direção',
    '1100.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    74,
  ],
  [
    'Suspensão',
    'Rolamentos de roda / cubos',
    '550.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    75,
  ],
  [
    'Freios',
    'Pastilhas de freio',
    '280.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    80,
  ],
  [
    'Freios',
    'Discos / tambores',
    '650.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    81,
  ],
  [
    'Freios',
    'Pinças / cilindros / reparos',
    '700.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    82,
  ],
  [
    'Freios',
    'Fluido / flexíveis / tubulação',
    '320.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    83,
  ],
  [
    'Freios',
    'Freio de estacionamento',
    '420.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    84,
  ],
  [
    'Freios',
    'ABS / módulo / sensores',
    '900.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    85,
  ],
  [
    'Documentação',
    'Transferência / ATPV-e / CRV-CRLV',
    '420.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    90,
  ],
  [
    'Documentação',
    'Vistoria / laudo / ECV',
    '180.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    91,
  ],
  [
    'Documentação',
    'Licenciamento em atraso',
    '320.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    92,
  ],
  [
    'Documentação',
    'Débitos de IPVA / multas',
    '1000.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    93,
  ],
  [
    'Documentação',
    'Placas / tarjeta / lacre',
    '180.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    94,
  ],
  [
    'Documentação',
    'Remarcação chassi / motor / 2ª via',
    '380.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    95,
  ],
  [
    'Segurança',
    'Airbags / luz SRS',
    '4500.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    100,
  ],
  [
    'Segurança',
    'Cintos de segurança',
    '650.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    101,
  ],
  [
    'Segurança',
    'Encostos de cabeça / ancoragens',
    '250.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    102,
  ],
  [
    'Segurança',
    'Espelhos retrovisores obrigatórios',
    '300.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    103,
  ],
  [
    'Segurança',
    'Faróis / setas / lanternas obrigatórias',
    '300.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    104,
  ],
  [
    'Segurança',
    'Recall pendente crítico',
    '0.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    105,
  ],
  [
    'Inspeção/Outros',
    'Scanner OBD / diagnóstico',
    '120.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    110,
  ],
  [
    'Inspeção/Outros',
    'Laudo cautelar / procedência',
    '250.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    111,
  ],
  [
    'Inspeção/Outros',
    'Sinais de enchente / salinidade',
    '6000.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    112,
  ],
  [
    'Inspeção/Outros',
    'Guincho / remoção',
    '450.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    113,
  ],
  [
    'Inspeção/Outros',
    'Higienização / odor / detailing',
    '380.00',
    ChecklistSeverity.LOW,
    false,
    false,
    114,
  ],
  [
    'Inspeção/Outros',
    'Preparação estética para venda',
    '650.00',
    ChecklistSeverity.LOW,
    false,
    false,
    115,
  ],
] satisfies ChecklistItemSeed[];

const motorcycleChecklistItems = [
  [
    'Motor',
    'Compressao / fumaca / sopro',
    '3200.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    10,
  ],
  [
    'Motor',
    'Cabecote / valvulas / comando',
    '1200.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    11,
  ],
  [
    'Motor',
    'Vazamentos do motor',
    '380.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    12,
  ],
  [
    'Motor',
    'Sistema de arrefecimento',
    '450.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    13,
  ],
  [
    'Motor',
    'Injecao / TBI / ignicao',
    '550.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    14,
  ],
  [
    'Motor',
    'Carter / tampa lateral / carcaca',
    '1100.00',
    ChecklistSeverity.HIGH,
    false,
    false,
    15,
  ],
  [
    'Transmissao',
    'Kit relacao (corrente/coroa/pinhao)',
    '180.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    20,
  ],
  [
    'Transmissao',
    'Kit de embreagem',
    '320.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    21,
  ],
  [
    'Transmissao',
    'Cabo / atuador da embreagem',
    '60.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    22,
  ],
  [
    'Transmissao',
    'Cambio / seletores / pedal',
    '900.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    23,
  ],
  [
    'Transmissao',
    'Retentores / vazamentos da transmissao',
    '220.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    24,
  ],
  [
    'Transmissao',
    'Cubo / campana / rolamentos da transmissao',
    '420.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    25,
  ],
  [
    'Pneus',
    'Pneu dianteiro',
    '220.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    30,
  ],
  ['Pneus', 'Pneu traseiro', '260.00', ChecklistSeverity.HIGH, false, true, 31],
  [
    'Pneus',
    'Camara de ar / valvulas',
    '45.00',
    ChecklistSeverity.LOW,
    true,
    false,
    32,
  ],
  [
    'Pneus',
    'Rodas / aros',
    '260.00',
    ChecklistSeverity.MEDIUM,
    true,
    false,
    33,
  ],
  [
    'Pneus',
    'Balanceamento / alinhamento de rodas',
    '60.00',
    ChecklistSeverity.LOW,
    true,
    false,
    34,
  ],
  [
    'Pneus',
    'Rolamentos de roda',
    '80.00',
    ChecklistSeverity.MEDIUM,
    true,
    false,
    35,
  ],
  [
    'Eletrica',
    'Bateria 12V',
    '240.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    40,
  ],
  [
    'Eletrica',
    'Estator / regulador / retificador',
    '520.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    41,
  ],
  [
    'Eletrica',
    'Motor de partida / rele',
    '320.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    42,
  ],
  [
    'Eletrica',
    'Iluminacao / painel',
    '260.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    43,
  ],
  [
    'Eletrica',
    'Chicote / fusiveis / conectores',
    '320.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    44,
  ],
  [
    'Eletrica',
    'Sensores / painel de instrumentos',
    '450.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    45,
  ],
  [
    'Lataria',
    'Tanque de combustivel',
    '850.00',
    ChecklistSeverity.HIGH,
    false,
    false,
    50,
  ],
  [
    'Lataria',
    'Kit carenagem / laterais / rabeta',
    '650.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    51,
  ],
  [
    'Lataria',
    'Conjunto frontal / farol / suporte',
    '420.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    52,
  ],
  [
    'Lataria',
    'Retrovisores / manetes',
    '90.00',
    ChecklistSeverity.MEDIUM,
    true,
    true,
    53,
  ],
  [
    'Lataria',
    'Pedaleiras / suportes / escape',
    '420.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    54,
  ],
  [
    'Lataria',
    'Quadro / berco / soldas aparentes',
    '2500.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    55,
  ],
  [
    'Interior/Comandos',
    'Banco / trava / base',
    '220.00',
    ChecklistSeverity.LOW,
    false,
    false,
    60,
  ],
  [
    'Interior/Comandos',
    'Painel / velocimetro',
    '350.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    61,
  ],
  [
    'Interior/Comandos',
    'Comutador de ignicao / chave',
    '320.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    62,
  ],
  [
    'Interior/Comandos',
    'Acelerador / manoplas / punhos',
    '80.00',
    ChecklistSeverity.LOW,
    false,
    false,
    63,
  ],
  [
    'Interior/Comandos',
    'Comando de embreagem / manete',
    '70.00',
    ChecklistSeverity.LOW,
    false,
    false,
    64,
  ],
  [
    'Interior/Comandos',
    'Comando de freio / pedal',
    '80.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    65,
  ],
  [
    'Suspensao',
    'Bengalas dianteiras',
    '520.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    70,
  ],
  [
    'Suspensao',
    'Mesas / caixa de direcao',
    '380.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    71,
  ],
  [
    'Suspensao',
    'Amortecedor(es) traseiro(s)',
    '360.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    72,
  ],
  [
    'Suspensao',
    'Balanca / buchas / quadro elastico',
    '150.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    73,
  ],
  [
    'Suspensao',
    'Alinhamento de chassi',
    '900.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    74,
  ],
  [
    'Suspensao',
    'Rolamentos da direcao / rodas',
    '160.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    75,
  ],
  [
    'Freios',
    'Pastilhas dianteiras',
    '65.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    80,
  ],
  [
    'Freios',
    'Disco dianteiro',
    '180.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    81,
  ],
  [
    'Freios',
    'Sistema traseiro (lona/pastilha)',
    '120.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    82,
  ],
  [
    'Freios',
    'Fluido / mangueiras / flexiveis',
    '120.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    83,
  ],
  [
    'Freios',
    'Pinca / cilindro mestre',
    '380.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    84,
  ],
  [
    'Freios',
    'ABS / CBS / sensor de roda',
    '480.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    85,
  ],
  [
    'Documentacao',
    'Transferencia / ATPV-e / CRV-CRLV',
    '380.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    90,
  ],
  [
    'Documentacao',
    'Vistoria / laudo / ECV',
    '160.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    91,
  ],
  [
    'Documentacao',
    'Licenciamento em atraso',
    '260.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    92,
  ],
  [
    'Documentacao',
    'Debitos de IPVA / multas',
    '700.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    93,
  ],
  [
    'Documentacao',
    'Placa / suporte / lacre',
    '150.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    94,
  ],
  [
    'Documentacao',
    'Remarcacao chassi / motor / 2a via',
    '320.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    95,
  ],
  [
    'Seguranca',
    'Quadro trincado / solda estrutural',
    '2600.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    100,
  ],
  [
    'Seguranca',
    'Espelhos retrovisores obrigatorios',
    '90.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    101,
  ],
  [
    'Seguranca',
    'Farol / setas / lanterna / luz de placa',
    '250.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    102,
  ],
  ['Seguranca', 'Buzina', '45.00', ChecklistSeverity.MEDIUM, false, true, 103],
  [
    'Seguranca',
    'Escapamento / ruido / protetor termico',
    '320.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    104,
  ],
  [
    'Seguranca',
    'Recall pendente critico',
    '0.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    105,
  ],
  [
    'Inspecao/Outros',
    'Scanner / diagnostico eletronico',
    '100.00',
    ChecklistSeverity.MEDIUM,
    false,
    true,
    110,
  ],
  [
    'Inspecao/Outros',
    'Laudo cautelar / procedencia',
    '220.00',
    ChecklistSeverity.HIGH,
    false,
    true,
    111,
  ],
  [
    'Inspecao/Outros',
    'Sinais de enchente / oxidacao severa',
    '2200.00',
    ChecklistSeverity.CRITICAL,
    false,
    true,
    112,
  ],
  [
    'Inspecao/Outros',
    'Guincho / remocao',
    '180.00',
    ChecklistSeverity.MEDIUM,
    false,
    false,
    113,
  ],
  [
    'Inspecao/Outros',
    'Higienizacao / lavagem tecnica',
    '160.00',
    ChecklistSeverity.LOW,
    false,
    false,
    114,
  ],
  [
    'Inspecao/Outros',
    'Preparacao estetica para venda',
    '260.00',
    ChecklistSeverity.LOW,
    false,
    false,
    115,
  ],
] satisfies ChecklistItemSeed[];

const questionByName: Record<string, string> = {
  'Compressão / fumaça / sopro':
    'O motor apresenta fumaça, perda de compressão, sopro ou funcionamento irregular?',
  'Junta do cabeçote':
    'Há sinais de problema na junta do cabeçote, como mistura de óleo e água, superaquecimento ou fumaça branca?',
  'Vazamentos de óleo e vedações':
    'Há vazamentos de óleo no motor, câmbio ou vedações aparentes?',
  'Vazamentos do motor':
    'O motor apresenta vazamento de óleo ou fluido aparente?',
  'Sistema de arrefecimento':
    'O sistema de arrefecimento apresenta vazamento, superaquecimento, reservatório sujo ou ventoinha com falha?',
  'Injeção / ignição':
    'O veículo apresenta falhas de injeção, ignição, marcha lenta irregular ou luz de injeção acesa?',
  'Injeção / TBI / ignição':
    'A moto apresenta falhas de injeção, TBI, ignição, partida ou marcha lenta irregular?',
  'Coxins do motor':
    'Os coxins do motor estão quebrados, ressecados ou causando vibração excessiva?',
  'Cabeçote / válvulas / comando':
    'Há sinais de problema no cabeçote, válvulas, comando ou ruído interno no motor?',
  'Cárter / tampa lateral / carcaça':
    'Há dano no cárter, tampa lateral ou carcaça do motor?',
  'Kit de embreagem':
    'A embreagem apresenta desgaste, patinação, trepidação ou dificuldade de acionamento?',
  'Câmbio manual / automático / CVT':
    'O câmbio apresenta trancos, patinação, ruídos, vazamentos ou dificuldade nas trocas?',
  'Atuador / cabo / hidráulico da embreagem':
    'O sistema de acionamento da embreagem precisa de reparo?',
  'Semi-eixos / juntas homocinéticas':
    'Há ruídos, folgas ou danos em semi-eixos e juntas homocinéticas?',
  'Retentores e vazamentos do câmbio':
    'Há vazamento de óleo no câmbio ou nos retentores da transmissão?',
  'Trambulador / alavanca / coxins da caixa':
    'O trambulador, alavanca ou coxins da caixa apresentam folga, ruído ou dificuldade de engate?',
  'Kit relação (corrente/coroa/pinhão)':
    'O kit relação apresenta desgaste, corrente folgada, coroa ou pinhão gastos?',
  'Cabo / atuador da embreagem':
    'O cabo ou atuador da embreagem precisa de ajuste ou substituição?',
  'Câmbio / seletores / pedal':
    'O câmbio, seletores ou pedal de marcha apresentam falha, folga ou dificuldade de engate?',
  'Retentores / vazamentos da transmissão':
    'Há vazamentos ou sinais de desgaste nos retentores da transmissão?',
  'Cubo / campana / rolamentos da transmissão':
    'Há desgaste, folga ou ruído no cubo, campana ou rolamentos da transmissão?',
  'Pneus de rodagem': 'Quantos pneus de rodagem precisam ser trocados?',
  Estepe: 'O estepe está ausente, careca, vencido ou inutilizável?',
  'Rodas / aros':
    'Quantas rodas ou aros estão amassados, trincados ou danificados?',
  Alinhamento: 'O veículo precisa de alinhamento?',
  Balanceamento: 'Quantas rodas precisam de balanceamento?',
  'Válvulas / bicos / TPMS': 'Há válvulas, bicos ou sensores TPMS danificados?',
  'Pneu dianteiro': 'O pneu dianteiro precisa ser trocado?',
  'Pneu traseiro': 'O pneu traseiro precisa ser trocado?',
  'Câmara de ar / válvulas': 'Há câmara de ar ou válvulas danificadas?',
  'Balanceamento / alinhamento de rodas':
    'As rodas precisam de balanceamento ou alinhamento?',
  'Rolamentos de roda': 'Há ruído, folga ou desgaste nos rolamentos de roda?',
  'Bateria 12V':
    'A bateria está fraca, ausente, descarregada ou sem condição de uso?',
  'Alternador / carga': 'O alternador ou sistema de carga apresenta falha?',
  'Motor de partida':
    'O motor de partida apresenta falha ou dificuldade de acionamento?',
  'Motor de partida / relé': 'O motor de partida ou relé apresenta falha?',
  'Iluminação externa':
    'Faróis, lanternas, setas ou luzes obrigatórias apresentam falha?',
  'Iluminação / painel': 'Farol, setas, lanterna ou painel apresentam falha?',
  'Vidros / travas / comandos elétricos':
    'Vidros, travas ou comandos elétricos apresentam falha?',
  'ECU / chicote / fusíveis / relés':
    'Há falha em ECU, chicote, fusíveis, relés ou conectores elétricos?',
  'Estator / regulador / retificador':
    'O estator, regulador ou retificador apresenta falha no sistema de carga?',
  'Chicote / fusíveis / conectores':
    'Há chicote, fusíveis ou conectores danificados, oxidados ou cortados?',
  'Sensores / painel de instrumentos':
    'Sensores ou painel de instrumentos apresentam falha?',
  'Para-choques e grades':
    'Para-choques ou grades estão quebrados, desalinhados ou precisam de reparo?',
  'Capô / tampa traseira / fechaduras':
    'Capô, tampa traseira ou fechaduras apresentam amassados, desalinhamento ou falha?',
  'Portas / paralamas / caixa de ar':
    'Portas, paralamas ou caixa de ar apresentam amassados, ferrugem ou desalinhamento?',
  'Para-brisa / vidros fixos':
    'Para-brisa ou vidros fixos estão trincados, quebrados ou precisam de troca?',
  'Retrovisores externos':
    'Quantos retrovisores externos precisam de reparo ou substituição?',
  'Estrutura frontal / traseira / longarinas':
    'Há indício de dano estrutural em longarinas, estrutura frontal ou traseira?',
  'Tanque de combustível':
    'O tanque apresenta amassado, vazamento, ferrugem ou dano aparente?',
  'Kit carenagem / laterais / rabeta':
    'Carenagens, laterais ou rabeta apresentam quebras, trincas ou ausência de peças?',
  'Conjunto frontal / farol / suporte':
    'O conjunto frontal, farol ou suporte apresenta dano?',
  'Retrovisores / manetes':
    'Retrovisores ou manetes precisam de reparo ou substituição?',
  'Pedaleiras / suportes / escape':
    'Pedaleiras, suportes ou escapamento apresentam dano ou desalinhamento?',
  'Quadro / berço / soldas aparentes':
    'Há indícios de dano estrutural no quadro, berço ou soldas aparentes?',
  'Painel / acabamento interno':
    'Painel ou acabamento interno apresentam quebras, faltas ou mau estado?',
  'Bancos / trilhos / regulagens':
    'Bancos, trilhos ou regulagens apresentam danos ou falhas?',
  'Forros / vedação / infiltração':
    'Há forros danificados, vedação comprometida ou sinais de infiltração?',
  'Ar-condicionado / ventilação':
    'Ar-condicionado ou ventilação apresentam falha?',
  'Painel de instrumentos / multimídia':
    'Painel de instrumentos ou multimídia apresenta falha?',
  'Chaves / telecomando / miolo':
    'Chaves, telecomando ou miolo de ignição estão ausentes ou com defeito?',
  'Banco / trava / base': 'Banco, trava ou base apresentam dano ou folga?',
  'Painel / velocímetro':
    'Painel ou velocímetro apresenta falha, quebra ou ausência de funcionamento?',
  'Comutador de ignição / chave':
    'Comutador de ignição ou chave apresenta falha ou ausência?',
  'Acelerador / manoplas / punhos':
    'Acelerador, manoplas ou punhos apresentam desgaste ou falha?',
  'Comando de embreagem / manete':
    'Comando de embreagem ou manete apresenta folga, quebra ou falha?',
  'Comando de freio / pedal':
    'Comando de freio ou pedal apresenta folga, quebra ou falha?',
  'Amortecedores dianteiros':
    'Os amortecedores dianteiros apresentam vazamento, ruído ou desgaste?',
  'Amortecedores traseiros':
    'Os amortecedores traseiros apresentam vazamento, ruído ou desgaste?',
  'Bandejas / pivôs / buchas':
    'Bandejas, pivôs ou buchas apresentam folga, ruído ou desgaste?',
  'Molas / coxins / batentes':
    'Molas, coxins ou batentes apresentam desgaste, quebra ou ruído?',
  'Caixa / terminais / axiais de direção':
    'Caixa de direção, terminais ou axiais apresentam folga, ruído ou vazamento?',
  'Rolamentos de roda / cubos':
    'Rolamentos de roda ou cubos apresentam ruído, folga ou desgaste?',
  'Bengalas dianteiras':
    'As bengalas dianteiras estão tortas, vazando ou danificadas?',
  'Mesas / caixa de direção':
    'Mesas ou caixa de direção apresentam folga, desalinhamento ou dano?',
  'Amortecedor(es) traseiro(s)':
    'Amortecedor traseiro apresenta vazamento, ruído ou desgaste?',
  'Balança / buchas / quadro elástico':
    'Balança, buchas ou quadro elástico apresentam folga ou desgaste?',
  'Alinhamento de chassi': 'Há suspeita de chassi desalinhado ou torto?',
  'Rolamentos da direção / rodas':
    'Rolamentos da direção ou rodas apresentam folga, ruído ou desgaste?',
  'Pastilhas de freio': 'As pastilhas de freio precisam ser trocadas?',
  'Discos / tambores':
    'Discos ou tambores apresentam desgaste, empeno ou trinca?',
  'Pinças / cilindros / reparos':
    'Pinças, cilindros ou reparos do freio apresentam falha ou vazamento?',
  'Fluido / flexíveis / tubulação':
    'Fluido, flexíveis ou tubulação de freio precisam de manutenção?',
  'Freio de estacionamento':
    'O freio de estacionamento apresenta falha ou regulagem ruim?',
  'ABS / módulo / sensores':
    'ABS, módulo ou sensores de freio apresentam falha?',
  'Pastilhas dianteiras': 'As pastilhas dianteiras precisam ser trocadas?',
  'Disco dianteiro': 'O disco dianteiro apresenta desgaste, empeno ou trinca?',
  'Sistema traseiro (lona/pastilha)':
    'O sistema de freio traseiro precisa de reparo?',
  'Fluido / mangueiras / flexíveis':
    'Fluido, mangueiras ou flexíveis de freio precisam de manutenção?',
  'Pinça / cilindro mestre':
    'Pinça ou cilindro mestre apresenta falha ou vazamento?',
  'ABS / CBS / sensor de roda': 'ABS, CBS ou sensor de roda apresenta falha?',
  'Transferência / ATPV-e / CRV-CRLV':
    'Será necessário pagar transferência, ATPV-e, CRV ou CRLV?',
  'Vistoria / laudo / ECV': 'Será necessário pagar vistoria, laudo ou ECV?',
  'Licenciamento em atraso': 'Existe licenciamento em atraso?',
  'Débitos de IPVA / multas':
    'Existem débitos de IPVA, multas ou outras pendências financeiras?',
  'Placas / tarjeta / lacre': 'Será necessário trocar placa, tarjeta ou lacre?',
  'Placa / suporte / lacre': 'Será necessário trocar placa, suporte ou lacre?',
  'Remarcação chassi / motor / 2ª via':
    'Será necessário regularizar remarcação de chassi, motor ou segunda via de documento?',
  'Airbags / luz SRS': 'Airbags, módulo SRS ou luz de airbag apresentam falha?',
  'Cintos de segurança':
    'Cintos de segurança apresentam falha, travamento ou ausência?',
  'Encostos de cabeça / ancoragens':
    'Encostos de cabeça ou ancoragens apresentam ausência ou dano?',
  'Espelhos retrovisores obrigatórios':
    'Espelhos retrovisores obrigatórios estão ausentes ou danificados?',
  'Faróis / setas / lanternas obrigatórias':
    'Faróis, setas ou lanternas obrigatórias apresentam falha?',
  'Farol / setas / lanterna / luz de placa':
    'Farol, setas, lanterna ou luz de placa apresentam falha?',
  'Recall pendente crítico':
    'Existe recall pendente que pode impedir licenciamento ou venda segura?',
  'Quadro trincado / solda estrutural':
    'Há quadro trincado, solda estrutural ou reparo estrutural aparente?',
  Buzina: 'A buzina apresenta falha ou ausência de funcionamento?',
  'Escapamento / ruído / protetor térmico':
    'Escapamento, ruído ou protetor térmico apresenta problema?',
  'Scanner OBD / diagnóstico':
    'Será necessário realizar scanner OBD ou diagnóstico eletrônico?',
  'Scanner / diagnóstico eletrônico':
    'Será necessário realizar scanner ou diagnóstico eletrônico?',
  'Laudo cautelar / procedência':
    'Será necessário fazer laudo cautelar ou consulta de procedência?',
  'Sinais de enchente / salinidade':
    'Há sinais de enchente, salinidade, oxidação severa ou lama em componentes internos?',
  'Sinais de enchente / oxidação severa':
    'Há sinais de enchente, oxidação severa ou lama em componentes internos?',
  'Guincho / remoção': 'Será necessário contratar guincho ou remoção?',
  'Higienização / odor / detailing':
    'Será necessário fazer higienização, remoção de odor ou detailing?',
  'Higienização / lavagem técnica':
    'Será necessário fazer higienização ou lavagem técnica?',
  'Preparação estética para venda':
    'Será necessário fazer preparação estética antes da revenda?',
};

const normalizedQuestionByName = new Map(
  Object.entries(questionByName).map(([name, question]) => [
    normalizeChecklistName(name),
    question,
  ]),
);

function normalizeChecklistName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildChecklistQuestion(itemName: string): string {
  return (
    questionByName[itemName] ??
    normalizedQuestionByName.get(normalizeChecklistName(itemName)) ??
    `O item "${itemName}" apresenta problema, dano, desgaste ou pendência?`
  );
}

async function seedChecklistTemplate(params: {
  name: string;
  vehicleType: VehicleType;
  items: ChecklistItemSeed[];
}): Promise<number> {
  await prisma.checklistTemplate.updateMany({
    where: {
      vehicleType: params.vehicleType,
      name: {
        not: params.name,
      },
    },
    data: {
      isActive: false,
    },
  });

  const checklistTemplate = await prisma.checklistTemplate.findFirst({
    where: {
      name: params.name,
      vehicleType: params.vehicleType,
    },
    select: {
      id: true,
    },
  });

  const template =
    checklistTemplate ??
    (await prisma.checklistTemplate.create({
      data: {
        name: params.name,
        vehicleType: params.vehicleType,
        isActive: true,
      },
      select: {
        id: true,
      },
    }));

  await prisma.checklistTemplate.update({
    where: {
      id: template.id,
    },
    data: {
      isActive: true,
    },
  });

  /**
   * Checklist items are reference data. Replacing only the items from this
   * template keeps local/dev databases synchronized with this source file.
   */
  await prisma.$transaction([
    prisma.checklistTemplateItem.deleteMany({
      where: {
        templateId: template.id,
      },
    }),
    prisma.checklistTemplateItem.createMany({
      data: params.items.map(
        ([
          category,
          name,
          defaultEstimatedCost,
          severity,
          requiresQuantity,
          isRequired,
          order,
        ]) => ({
          templateId: template.id,
          category,
          name,
          question: buildChecklistQuestion(name),
          defaultEstimatedCost,
          severity,
          requiresQuantity,
          isRequired,
          order,
        }),
      ),
    }),
  ]);

  return params.items.length;
}

async function main() {
  const hashService = new HashService();
  const adminSeedPassword = resolveSeedPassword(
    'ADMIN_SEED_PASSWORD',
    seedUsers[0].password,
  );
  const userSeedPassword = resolveSeedPassword(
    'USER_SEED_PASSWORD',
    seedUsers[1].password,
  );

  const [adminPassword, userPassword] = await Promise.all([
    hashService.hash(adminSeedPassword),
    hashService.hash(userSeedPassword),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: seedUsers[0].email },
    update: {
      name: seedUsers[0].name,
      password: adminPassword,
      role: seedUsers[0].role,
      isActive: true,
    },
    create: {
      name: seedUsers[0].name,
      email: seedUsers[0].email,
      password: adminPassword,
      role: seedUsers[0].role,
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: seedUsers[1].email },
    update: {
      name: seedUsers[1].name,
      password: userPassword,
      role: seedUsers[1].role,
      isActive: true,
    },
    create: {
      name: seedUsers[1].name,
      email: seedUsers[1].email,
      password: userPassword,
      role: seedUsers[1].role,
      isActive: true,
    },
  });

  /**
   * Vehicles do not have a unique plate constraint in the schema, so the seed
   * checks by user + plate before inserting to stay idempotent.
   */
  for (const vehicle of seedVehicles) {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        userId: user.id,
        plate: vehicle.plate,
      },
      select: {
        id: true,
      },
    });

    if (!existingVehicle) {
      await prisma.vehicle.create({
        data: {
          ...vehicle,
          userId: user.id,
        },
      });
    }
  }

  const [carChecklistItemsCount, motorcycleChecklistItemsCount] =
    await Promise.all([
      seedChecklistTemplate({
        name: 'Checklist padrão carro - leilão',
        vehicleType: VehicleType.CAR,
        items: carChecklistItems,
      }),
      seedChecklistTemplate({
        name: 'Checklist padrão moto - leilão',
        vehicleType: VehicleType.MOTORCYCLE,
        items: motorcycleChecklistItems,
      }),
    ]);

  console.log('Seed executado com sucesso');
  console.log(`Admin: ${admin.email}`);
  console.log(`Usuario: ${user.email}`);
  console.log(`Veiculos criados/verificados: ${seedVehicles.length}`);
  console.log(`Itens do checklist de carro criados: ${carChecklistItemsCount}`);
  console.log(
    `Itens do checklist de moto criados: ${motorcycleChecklistItemsCount}`,
  );
}

function resolveSeedPassword(envKey: string, developmentFallback: string) {
  const configuredPassword = process.env[envKey];

  if (configuredPassword) {
    return configuredPassword;
  }

  if (['development', 'test', undefined].includes(process.env.NODE_ENV)) {
    return developmentFallback;
  }

  throw new Error(`${envKey} is required outside development/test.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
