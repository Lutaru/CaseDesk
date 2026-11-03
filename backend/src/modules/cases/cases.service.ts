import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Case } from './entities/case.entity';
import { CaseTechnicalAnalysis } from '../technical-analysis/entities/case-technical-analysis.entity';
import { CaseSolution } from '../solutions/entities/case-solution.entity';
import { CaseClientResponse } from '../client-responses/entities/case-client-response.entity';
import { CaseTimeline } from '../timeline/entities/case-timeline.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateCaseDto,
  UpdateCaseStatusDto,
  UpdateCaseTechnicalAnalysisDto,
  UpdateCaseSolutionDto,
  UpdateCaseClientResponseDto,
  AddTimelineCommentDto,
  CaseQueryDto,
} from './dto/case.dto';
import {
  CasePriority,
  CaseStatus,
  CaseType,
  ClientResponseStatus,
} from '../../common/enums';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(CaseTechnicalAnalysis)
    private readonly analysisRepo: Repository<CaseTechnicalAnalysis>,
    @InjectRepository(CaseSolution)
    private readonly solutionRepo: Repository<CaseSolution>,
    @InjectRepository(CaseClientResponse)
    private readonly clientResponseRepo: Repository<CaseClientResponse>,
    @InjectRepository(CaseTimeline)
    private readonly timelineRepo: Repository<CaseTimeline>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Genera el siguiente código secuencial único para el caso (ej. CASO-00227)
   */
  private async generateUniqueCode(): Promise<string> {
    const lastCase = await this.caseRepo
      .createQueryBuilder('c')
      .select('c.code')
      .where("c.code LIKE 'CASO-%'")
      .orderBy('c.createdAt', 'DESC')
      .getOne();

    if (!lastCase) {
      return 'CASO-00100';
    }

    const match = lastCase.code.match(/CASO-(\d+)/);
    if (match && match[1]) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `CASO-${nextNum.toString().padStart(5, '0')}`;
    }

    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
    return `CASO-${randomSuffix}`;
  }

  async findAll(query: CaseQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.client', 'client')
      .leftJoinAndSelect('c.assignedTo', 'assignedTo')
      .leftJoinAndSelect('c.createdBy', 'createdBy');

    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('c.priority = :priority', { priority: query.priority });
    }

    if (query.clientId) {
      qb.andWhere('c.clientId = :clientId', { clientId: query.clientId });
    }

    if (query.search) {
      qb.andWhere(
        '(c.code ILIKE :search OR c.title ILIKE :search OR c.descriptionRaw ILIKE :search OR client.businessName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('c.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(idOrCode: string): Promise<Case> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrCode,
      );

    const qb = this.caseRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.client', 'client')
      .leftJoinAndSelect('client.dbConnections', 'dbConnections')
      .leftJoinAndSelect('c.assignedTo', 'assignedTo')
      .leftJoinAndSelect('c.createdBy', 'createdBy')
      .leftJoinAndSelect('c.technicalAnalysis', 'technicalAnalysis')
      .leftJoinAndSelect('c.solution', 'solution')
      .leftJoinAndSelect('c.clientResponse', 'clientResponse')
      .leftJoinAndSelect('c.attachments', 'attachments')
      .leftJoinAndSelect('c.timeline', 'timeline')
      .leftJoinAndSelect('timeline.performedBy', 'performedBy');

    if (isUuid) {
      qb.where('c.id = :id', { id: idOrCode });
    } else {
      qb.where('c.code = :code', { code: idOrCode });
    }

    qb.orderBy('timeline.createdAt', 'DESC');

    const caseItem = await qb.getOne();
    if (!caseItem) {
      throw new NotFoundException(`Caso "${idOrCode}" no encontrado`);
    }

    return caseItem;
  }

  async create(dto: CreateCaseDto, userId: string): Promise<Case> {
    const client = await this.clientRepo.findOneBy({ id: dto.clientId });
    if (!client) {
      throw new NotFoundException('El cliente asociado no existe');
    }

    const code = await this.generateUniqueCode();

    const newCase = this.caseRepo.create({
      code,
      title: dto.title,
      descriptionRaw: dto.descriptionRaw,
      affectedSystem: dto.affectedSystem,
      affectedModule: dto.affectedModule || 'General',
      caseType: dto.caseType || CaseType.ERROR,
      priority: dto.priority || CasePriority.MEDIA,
      status: CaseStatus.REGISTRADO,
      clientId: client.id,
      client,
      createdById: userId,
      assignedToId: dto.assignedToId || undefined,
    });

    const savedCase = await this.caseRepo.save(newCase);

    // Inicializar Análisis Técnico
    const analysis = this.analysisRepo.create({
      caseId: savedCase.id,
      version: 1,
      rootCauseSummary: 'Pendiente de diagnóstico inicial',
      hypothesesAndFindings: '',
      diagnosticQueriesSql: '',
      reproductionSteps: '',
    });
    await this.analysisRepo.save(analysis);

    // Inicializar Solución
    const solution = this.solutionRepo.create({
      caseId: savedCase.id,
      solutionSummary: 'En evaluación de opciones de solución',
      solutionScriptSql: '',
      rollbackProcedure: '',
    });
    await this.solutionRepo.save(solution);

    // Inicializar Respuesta al Cliente
    const clientResponse = this.clientResponseRepo.create({
      caseId: savedCase.id,
      issueSummaryClient: dto.title,
      actionTakenClient: 'El caso fue registrado y recibido por el equipo técnico.',
      status: ClientResponseStatus.BORRADOR,
    });
    await this.clientResponseRepo.save(clientResponse);

    // Crear evento inicial en Timeline
    const timelineEvent = this.timelineRepo.create({
      caseId: savedCase.id,
      eventType: 'CASO_REGISTRADO',
      toValue: CaseStatus.REGISTRADO,
      description: `Caso ${code} registrado por el usuario.`,
      performedById: userId,
      isInternalOnly: false,
    });
    await this.timelineRepo.save(timelineEvent);

    return this.findOne(savedCase.id);
  }

  async updateStatus(
    id: string,
    dto: UpdateCaseStatusDto,
    userId: string,
  ): Promise<Case> {
    const caseItem = await this.findOne(id);
    const oldStatus = caseItem.status;

    if (oldStatus === dto.status) {
      return caseItem;
    }

    caseItem.status = dto.status;
    if (dto.status === CaseStatus.CERRADO) {
      caseItem.closedAt = new Date();
    }

    await this.caseRepo.save(caseItem);

    // Registrar en Timeline
    const timelineEvent = this.timelineRepo.create({
      caseId: caseItem.id,
      eventType: 'ESTADO_CAMBIADO',
      fromValue: oldStatus,
      toValue: dto.status,
      description:
        dto.comment || `Estado actualizado de ${oldStatus} a ${dto.status}`,
      performedById: userId,
      isInternalOnly: false,
    });
    await this.timelineRepo.save(timelineEvent);

    return this.findOne(caseItem.id);
  }

  async updateTechnicalAnalysis(
    caseId: string,
    dto: UpdateCaseTechnicalAnalysisDto,
    userId: string,
  ): Promise<CaseTechnicalAnalysis> {
    const caseItem = await this.findOne(caseId);

    let analysis = await this.analysisRepo.findOneBy({ caseId: caseItem.id });
    if (!analysis) {
      analysis = this.analysisRepo.create({
        caseId: caseItem.id,
        version: 1,
      });
    }

    if (dto.rootCauseSummary !== undefined)
      analysis.rootCauseSummary = dto.rootCauseSummary;
    if (dto.reproductionSteps !== undefined)
      analysis.reproductionSteps = dto.reproductionSteps;
    if (dto.affectedObjects !== undefined)
      analysis.affectedObjects = dto.affectedObjects;
    if (dto.diagnosticQueriesSql !== undefined)
      analysis.diagnosticQueriesSql = dto.diagnosticQueriesSql;
    if (dto.hypothesesAndFindings !== undefined)
      analysis.hypothesesAndFindings = dto.hypothesesAndFindings;
    if (dto.risksAndDependencies !== undefined)
      analysis.risksAndDependencies = dto.risksAndDependencies;

    analysis.version += 1;
    analysis.lastModifiedById = userId;

    const savedAnalysis = await this.analysisRepo.save(analysis);

    // Timeline event interno
    const timelineEvent = this.timelineRepo.create({
      caseId: caseItem.id,
      eventType: 'ANALISIS_ACTUALIZADO',
      description: `Análisis técnico actualizado a versión v${analysis.version}.`,
      performedById: userId,
      isInternalOnly: true,
    });
    await this.timelineRepo.save(timelineEvent);

    return savedAnalysis;
  }

  async updateSolution(
    caseId: string,
    dto: UpdateCaseSolutionDto,
    userId: string,
  ): Promise<CaseSolution> {
    const caseItem = await this.findOne(caseId);

    let solution = await this.solutionRepo.findOneBy({ caseId: caseItem.id });
    if (!solution) {
      solution = this.solutionRepo.create({ caseId: caseItem.id });
    }

    solution.solutionSummary = dto.solutionSummary;
    if (dto.modifiedComponents !== undefined)
      solution.modifiedComponents = dto.modifiedComponents;
    if (dto.solutionScriptSql !== undefined)
      solution.solutionScriptSql = dto.solutionScriptSql;
    if (dto.implementationSteps !== undefined)
      solution.implementationSteps = dto.implementationSteps;
    if (dto.rollbackProcedure !== undefined)
      solution.rollbackProcedure = dto.rollbackProcedure;
    if (dto.validationEnvironment !== undefined)
      solution.validationEnvironment = dto.validationEnvironment;
    if (dto.testResults !== undefined) solution.testResults = dto.testResults;

    solution.testedById = userId;

    const savedSolution = await this.solutionRepo.save(solution);

    // Timeline event
    const timelineEvent = this.timelineRepo.create({
      caseId: caseItem.id,
      eventType: 'SOLUCION_ACTUALIZADA',
      description: 'Propuesta de solución y scripts técnicos actualizados.',
      performedById: userId,
      isInternalOnly: true,
    });
    await this.timelineRepo.save(timelineEvent);

    return savedSolution;
  }

  async updateClientResponse(
    caseId: string,
    dto: UpdateCaseClientResponseDto,
    userId: string,
  ): Promise<CaseClientResponse> {
    const caseItem = await this.findOne(caseId);

    let clientResponse = await this.clientResponseRepo.findOneBy({
      caseId: caseItem.id,
    });
    if (!clientResponse) {
      clientResponse = this.clientResponseRepo.create({ caseId: caseItem.id });
    }

    clientResponse.issueSummaryClient = dto.issueSummaryClient;
    if (dto.causeExplainedClient !== undefined)
      clientResponse.causeExplainedClient = dto.causeExplainedClient;
    clientResponse.actionTakenClient = dto.actionTakenClient;
    if (dto.pendingClientActions !== undefined)
      clientResponse.pendingClientActions = dto.pendingClientActions;
    if (dto.recommendations !== undefined)
      clientResponse.recommendations = dto.recommendations;

    if (dto.publishNow) {
      clientResponse.status = ClientResponseStatus.PUBLICADO;
      clientResponse.publishedById = userId;
      clientResponse.publishedAt = new Date();
    }

    const savedResponse = await this.clientResponseRepo.save(clientResponse);

    if (dto.publishNow) {
      const timelineEvent = this.timelineRepo.create({
        caseId: caseItem.id,
        eventType: 'RESPUESTA_PUBLICADA',
        description: 'Se ha publicado la respuesta oficial visible para el cliente.',
        performedById: userId,
        isInternalOnly: false,
      });
      await this.timelineRepo.save(timelineEvent);
    }

    return savedResponse;
  }

  async addTimelineComment(
    caseId: string,
    dto: AddTimelineCommentDto,
    userId: string,
  ): Promise<CaseTimeline> {
    const caseItem = await this.findOne(caseId);

    const event = this.timelineRepo.create({
      caseId: caseItem.id,
      eventType: 'COMENTARIO',
      description: dto.comment,
      isInternalOnly: dto.isInternalOnly ?? false,
      performedById: userId,
    });

    return this.timelineRepo.save(event);
  }

  async getMetrics() {
    const totalCases = await this.caseRepo.count();

    const openCases = await this.caseRepo.count({
      where: {
        status: Not(In([CaseStatus.CERRADO, CaseStatus.CANCELADO])),
      },
    });

    const analyzing = await this.caseRepo.count({
      where: {
        status: In([CaseStatus.ANALIZANDO, CaseStatus.GENERANDO_ANALISIS]),
      },
    });

    const inDevelopment = await this.caseRepo.count({
      where: {
        status: In([CaseStatus.EN_DESARROLLO, CaseStatus.EN_PRUEBAS]),
      },
    });

    const critical = await this.caseRepo.count({
      where: {
        priority: CasePriority.CRITICA,
        status: Not(In([CaseStatus.CERRADO, CaseStatus.CANCELADO])),
      },
    });

    const solved = await this.caseRepo.count({
      where: {
        status: CaseStatus.SOLUCIONADO,
      },
    });

    return {
      totalCases,
      openCases,
      analyzing,
      inDevelopment,
      critical,
      solved,
    };
  }
}
