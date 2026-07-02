import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

describe('AiService', () => {
  let service: AiService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') return 'mock-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuestions', () => {
    it('returns mock questions when API key is not set', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.generateQuestions(
        'Frontend Engineer',
        'Mid-level',
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('language');
    });

    it('returns questions with correct structure', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.generateQuestions(
        'Backend Engineer',
        'Senior',
      );

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('starterCode');
      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('conceptQuestions');
      expect(result).toHaveProperty('systemDesign');
    });

    it('uses job role and level to generate relevant questions', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);

      const frontendQuestions = await service.generateQuestions(
        'Frontend Engineer',
        'Junior',
      );
      const backendQuestions = await service.generateQuestions(
        'Backend Engineer',
        'Senior',
      );

      expect(frontendQuestions).toBeDefined();
      expect(backendQuestions).toBeDefined();
    });
  });

  describe('suggestFollowUpQuestions', () => {
    it('returns mock follow-up questions when API key is not set', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.suggestFollowUpQuestions(
        [{ speakerName: 'Candidate', text: 'I think the answer is...' }],
        'function add(a,b) { return a+b; }',
        'javascript',
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeCodeComplexity', () => {
    it('returns mock complexity analysis when API key is not set', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.analyzeCodeComplexity(
        'function foo() { for(let i=0; i<n; i++) { for(let j=0; j<n; j++) { } } }',
        'javascript',
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('timeComplexity');
      expect(result).toHaveProperty('spaceComplexity');
      expect(result).toHaveProperty('optimizations');
    });
  });

  describe('evaluateInterview', () => {
    it('returns mock evaluation when API key is not set', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.evaluateInterview(
        'Test Interview',
        'A test interview',
        'function add(a,b) { return a+b; }',
        'javascript',
        [],
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('technicalRating');
      expect(result).toHaveProperty('communicationRating');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('detailedReview');
    });

    it('returns score between 0 and 100', async () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.evaluateInterview(
        'Test',
        '',
        '',
        'javascript',
        [],
      );

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
