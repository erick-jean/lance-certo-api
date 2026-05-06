import { Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PrismaService } from 'src/database/prisma.service';
import { ResponseVehicleDto } from './dto/response-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createVehicleDto: CreateVehicleDto) {
    void createVehicleDto;
    return 'This action adds a new vehicle';
  }

  async findAll(userId: string): Promise<ResponseVehicleDto[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        userId,
      },
    });

    return vehicles.map((vehicle) => new ResponseVehicleDto(vehicle));
  }

  findOne(id: number) {
    return `This action returns a #${id} vehicle`;
  }

  update(id: number, updateVehicleDto: UpdateVehicleDto) {
    void updateVehicleDto;
    return `This action updates a #${id} vehicle`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicle`;
  }
}
