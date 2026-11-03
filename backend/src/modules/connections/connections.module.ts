import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientDbConnection } from './entities/client-db-connection.entity';
import { Client } from '../clients/entities/client.entity';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientDbConnection, Client])],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService, TypeOrmModule],
})
export class ConnectionsModule {}
