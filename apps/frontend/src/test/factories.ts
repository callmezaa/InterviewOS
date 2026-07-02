import { faker } from '@faker-js/faker';

export function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(['INTERVIEWER', 'CANDIDATE']),
    ...overrides,
  };
}

export function createInterview(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(4),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
    scheduledTime: faker.date.future().toISOString(),
    codeContent: '',
    language: faker.helpers.arrayElement(['javascript', 'typescript', 'python', 'go', 'rust', 'cpp']),
    transcript: [],
    feedback: null,
    recordingUrl: null,
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    participants: [
      {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        role: 'INTERVIEWER',
        user: {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          name: faker.person.fullName(),
          role: 'INTERVIEWER',
        },
      },
      {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        role: 'CANDIDATE',
        user: {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          name: faker.person.fullName(),
          role: 'CANDIDATE',
        },
      },
    ],
    ...overrides,
  };
}

export function createPeer(overrides: Record<string, unknown> = {}) {
  return {
    socketId: faker.string.alphanumeric(20),
    userId: faker.string.uuid(),
    userName: faker.person.fullName(),
    userRole: faker.helpers.arrayElement(['INTERVIEWER', 'CANDIDATE']),
    audioLevel: faker.number.int({ min: 0, max: 100 }),
    audioMuted: faker.datatype.boolean(),
    videoMuted: faker.datatype.boolean(),
    isSpeaking: faker.datatype.boolean(),
    isFocusLost: false,
    isTabSwitched: false,
    stream: null,
    ...overrides,
  };
}

export function createChatMessage(overrides: Record<string, unknown> = {}) {
  return {
    senderId: faker.string.uuid(),
    senderName: faker.person.fullName(),
    text: faker.lorem.sentence(),
    timestamp: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createTranscriptItem(overrides: Record<string, unknown> = {}) {
  return {
    speakerName: faker.person.fullName(),
    text: faker.lorem.sentence(),
    timestamp: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createProctoringLog(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    userName: faker.person.fullName(),
    eventType: faker.helpers.arrayElement(['tab-switch', 'focus-lost', 'focus-gained']),
    timestamp: faker.date.recent().toISOString(),
    reason: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    ...overrides,
  };
}
