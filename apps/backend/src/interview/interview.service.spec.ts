import { Test, TestingModule } from '@nestjs/testing';
import { InterviewService } from './interview.service';
import { PrismaService } from '../prisma.service';
import { AiService } from '../ai/ai.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { InterviewStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockInterviewData = {
  id: 'interview-1',
  title: 'Frontend Interview',
  description: 'Mid-level frontend position',
  scheduledTime: new Date('2026-06-10T10:00:00Z'),
  status: InterviewStatus.SCHEDULED,
  codeContent: null,
  language: null,
  transcript: null,
  whiteboardShapes: null,
  codeHistory: null,
  proctoringLogs: null,
  feedback: null,
  recordingUrl: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
};

const makeInterview = (overrides = {}) => ({
  ...mockInterviewData,
  participants: [
    {
      id: 'p-int-1',
      userId: 'interviewer-1',
      interviewId: 'interview-1',
      role: Role.INTERVIEWER,
      user: {
        id: 'interviewer-1',
        email: 'int@test.com',
        name: 'Interviewer',
        role: Role.INTERVIEWER,
      },
    },
    {
      id: 'p-cand-1',
      userId: 'candidate-1',
      interviewId: 'interview-1',
      role: Role.CANDIDATE,
      user: {
        id: 'candidate-1',
        email: 'cand@test.com',
        name: 'Candidate',
        role: Role.CANDIDATE,
      },
    },
  ],
  ...overrides,
});

const mockAiFeedback = {
  score: 85,
  technicalRating: 4.2,
  communicationRating: 4.0,
  summary: 'Good performance overall.',
  detailedReview: 'Solid code quality and communication.',
};

describe('InterviewService', () => {
  let service: InterviewService;
  let prisma: jest.Mocked<PrismaService>;
  let aiService: jest.Mocked<AiService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            interview: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AiService,
          useValue: {
            evaluateInterview: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-candidate-token'),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendInterviewInvitation: jest.fn().mockResolvedValue(undefined),
            sendInterviewFeedbackReady: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
    jwtService = module.get(JwtService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates an interview linking existing candidate', async () => {
      const existingInterviewer = {
        id: 'interviewer-1',
        email: 'int@test.com',
        name: 'Interviewer',
        role: Role.INTERVIEWER,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const existingCandidate = {
        id: 'candidate-1',
        email: 'cand@test.com',
        name: 'Candidate',
        role: Role.CANDIDATE,
        passwordHash: 'existing-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.findUnique as jest.Mock).mockImplementation(
        (args: { where: { id?: string; email?: string } }) => {
          if (args.where?.id === 'interviewer-1')
            return Promise.resolve(existingInterviewer);
          if (args.where?.email === 'cand@test.com')
            return Promise.resolve(existingCandidate);
          return Promise.resolve(null);
        },
      );
      (prisma.interview.create as jest.Mock).mockResolvedValue(makeInterview());

      const result = await service.create(
        'Frontend Interview',
        'Mid-level frontend position',
        new Date('2026-06-10T10:00:00Z'),
        'interviewer-1',
        'cand@test.com',
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.interview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Frontend Interview',
            status: InterviewStatus.SCHEDULED,
          }),
        }),
      );
      expect(result).toHaveProperty('candidateEmail', 'cand@test.com');
      expect(result).toHaveProperty('candidateToken', 'mock-candidate-token');
    });

    it('creates a new candidate user when candidate does not exist', async () => {
      const existingInterviewer = {
        id: 'interviewer-1',
        email: 'int@test.com',
        name: 'Interviewer',
        role: Role.INTERVIEWER,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.user.findUnique as jest.Mock).mockImplementation(
        (args: { where: { id?: string; email?: string } }) => {
          if (args.where?.id === 'interviewer-1')
            return Promise.resolve(existingInterviewer);
          return Promise.resolve(null);
        },
      );
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-candidate-1',
        email: 'new@test.com',
        name: 'new',
        role: Role.CANDIDATE,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.interview.create as jest.Mock).mockResolvedValue(
        makeInterview({
          participants: [
            /* overridden by prisma mock */
          ],
        }),
      );

      const result = await service.create(
        'Frontend Interview',
        'Description',
        new Date(),
        'interviewer-1',
        'new@test.com',
      );

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@test.com',
            role: Role.CANDIDATE,
          }),
        }),
      );
      expect(result).toHaveProperty('candidateEmail');
    });
  });

  describe('findUserInterviews', () => {
    it('returns interviews for a user sorted by scheduledTime', async () => {
      (prisma.interview.findMany as jest.Mock).mockResolvedValue([
        makeInterview({ id: 'iv-1' }),
        makeInterview({ id: 'iv-2' }),
      ]);

      const result = await service.findUserInterviews('user-1');

      expect(prisma.interview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { participants: { some: { userId: 'user-1' } } },
          orderBy: { scheduledTime: 'asc' },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('returns empty array when user has no interviews', async () => {
      (prisma.interview.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findUserInterviews('user-with-none');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns interview when found', async () => {
      (prisma.interview.findUnique as jest.Mock).mockResolvedValue(
        makeInterview(),
      );

      const result = await service.findOne('interview-1');

      expect(result).toHaveProperty('id', 'interview-1');
    });

    it('throws NotFoundException when interview not found', async () => {
      (prisma.interview.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates interview status', async () => {
      const updated = makeInterview({ status: InterviewStatus.COMPLETED });
      (prisma.interview.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateStatus(
        'interview-1',
        InterviewStatus.COMPLETED,
      );

      expect(prisma.interview.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'interview-1' },
          data: { status: InterviewStatus.COMPLETED },
        }),
      );
      expect(result.status).toBe(InterviewStatus.COMPLETED);
    });
  });

  describe('updateCode', () => {
    it('updates code content and language', async () => {
      const updated = makeInterview({
        codeContent: 'console.log("hi")',
        language: 'javascript',
      });
      (prisma.interview.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateCode(
        'interview-1',
        'console.log("hi")',
        'javascript',
      );

      expect(prisma.interview.update).toHaveBeenCalledWith({
        where: { id: 'interview-1' },
        data: { codeContent: 'console.log("hi")', language: 'javascript' },
      });
      expect(result.codeContent).toBe('console.log("hi")');
    });
  });

  describe('saveTranscript', () => {
    it('saves transcript as JSON value', async () => {
      const transcript = [
        { speakerName: 'A', text: 'Hello', timestamp: '2026-01-01T00:00:00Z' },
      ];
      const updated = makeInterview({ transcript });
      (prisma.interview.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.saveTranscript('interview-1', transcript);

      expect(prisma.interview.update).toHaveBeenCalledWith({
        where: { id: 'interview-1' },
        data: { transcript },
      });
      expect(result.transcript).toEqual(transcript);
    });
  });

  describe('generateMockFeedback', () => {
    it('generates AI feedback and updates interview to COMPLETED', async () => {
      const interviewWithData = makeInterview({
        codeContent: 'function add(a,b) { return a+b; }',
        language: 'javascript',
        transcript: [
          {
            speakerName: 'Candidate',
            text: 'I think the answer is...',
            timestamp: '2026-01-01T00:00:00Z',
          },
        ],
      });
      (prisma.interview.findUnique as jest.Mock).mockResolvedValue(
        interviewWithData,
      );
      (aiService.evaluateInterview as jest.Mock).mockResolvedValue(
        mockAiFeedback,
      );
      (prisma.interview.update as jest.Mock).mockResolvedValue({
        ...interviewWithData,
        feedback: mockAiFeedback,
        status: InterviewStatus.COMPLETED,
        participants: interviewWithData.participants,
      });

      const result = await service.generateMockFeedback('interview-1');

      expect(aiService.evaluateInterview).toHaveBeenCalledWith(
        'Frontend Interview',
        'Mid-level frontend position',
        'function add(a,b) { return a+b; }',
        'javascript',
        [
          {
            speakerName: 'Candidate',
            text: 'I think the answer is...',
            timestamp: '2026-01-01T00:00:00Z',
          },
        ],
      );
      expect(prisma.interview.update).toHaveBeenCalledWith({
        where: { id: 'interview-1' },
        data: { feedback: mockAiFeedback, status: InterviewStatus.COMPLETED },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, email: true, name: true, role: true },
              },
            },
          },
        },
      });
      expect(result.feedback).toEqual(mockAiFeedback);
      expect(result.status).toBe(InterviewStatus.COMPLETED);
    });

    it('handles transcript as JSON string by parsing it', async () => {
      const transcriptStr = JSON.stringify([
        {
          speakerName: 'Candidate',
          text: 'Hello',
          timestamp: '2026-01-01T00:00:00Z',
        },
      ]);
      const interviewWithStringTranscript = makeInterview({
        codeContent: 'code',
        language: 'python',
        transcript: transcriptStr,
      });
      (prisma.interview.findUnique as jest.Mock).mockResolvedValue(
        interviewWithStringTranscript,
      );
      (aiService.evaluateInterview as jest.Mock).mockResolvedValue(
        mockAiFeedback,
      );
      (prisma.interview.update as jest.Mock).mockResolvedValue({
        ...interviewWithStringTranscript,
        feedback: mockAiFeedback,
        status: InterviewStatus.COMPLETED,
      });

      const result = await service.generateMockFeedback('interview-1');

      expect(aiService.evaluateInterview).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        [
          {
            speakerName: 'Candidate',
            text: 'Hello',
            timestamp: '2026-01-01T00:00:00Z',
          },
        ],
      );
      expect(result.status).toBe(InterviewStatus.COMPLETED);
    });

    it('handles malformed transcript JSON gracefully', async () => {
      const interviewWithBadTranscript = makeInterview({
        codeContent: 'code',
        language: 'java',
        transcript: 'not-valid-json{{{',
      });
      (prisma.interview.findUnique as jest.Mock).mockResolvedValue(
        interviewWithBadTranscript,
      );
      (aiService.evaluateInterview as jest.Mock).mockResolvedValue(
        mockAiFeedback,
      );
      (prisma.interview.update as jest.Mock).mockResolvedValue({
        ...interviewWithBadTranscript,
        feedback: mockAiFeedback,
        status: InterviewStatus.COMPLETED,
      });

      const result = await service.generateMockFeedback('interview-1');

      expect(aiService.evaluateInterview).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        [],
      );
      expect(result.status).toBe(InterviewStatus.COMPLETED);
    });
  });
});
