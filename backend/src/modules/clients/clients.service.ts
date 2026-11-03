import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientRepo.find({
      relations: ['dbConnections'],
      order: { businessName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepo.findOne({
      where: { id },
      relations: ['dbConnections', 'authorizedUsers'],
    });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return client;
  }

  async create(dto: CreateClientDto): Promise<Client> {
    const existingCode = await this.clientRepo.findOne({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException(`El código de cliente "${dto.code}" ya existe`);
    }

    const client = this.clientRepo.create({
      ...dto,
      isActive: true,
    });

    return this.clientRepo.save(client);
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    if (dto.businessName !== undefined) client.businessName = dto.businessName;
    if (dto.taxId !== undefined) client.taxId = dto.taxId;
    if (dto.contactName !== undefined) client.contactName = dto.contactName;
    if (dto.contactEmail !== undefined) client.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) client.contactPhone = dto.contactPhone;
    if (dto.notes !== undefined) client.notes = dto.notes;
    if (dto.isActive !== undefined) client.isActive = dto.isActive;

    return this.clientRepo.save(client);
  }

  async toggleActive(id: string): Promise<Client> {
    const client = await this.findOne(id);
    client.isActive = !client.isActive;
    return this.clientRepo.save(client);
  }
}
