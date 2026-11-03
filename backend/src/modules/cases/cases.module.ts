import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { CaseTechnicalAnalysis } from '../technical-analysis/entities/case-technical-analysis.entity';
import { CaseSolution } from '../solutions/entities/case-solution.entity';
import { CaseClientResponse } from '../client-responses/entities/case-client-response.entity';
import { CaseAttachment } from '../attachments/entities/case-attachment.entity';
import { CaseTimeline } from '../timeline/entities/case-timeline.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      CaseTechnicalAnalysis,
      CaseSolution,
      CaseClientResponse,
      CaseAttachment,
      CaseTimeline,
      Client,
      User,
    ]),
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService, TypeOrmModule],
})
export class CasesModule {}
