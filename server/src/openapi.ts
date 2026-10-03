/**
 * Static OpenAPI 3.0 spec for the read-only /api/external surface, served at
 * GET /api/openapi.json and rendered by Swagger UI on the in-app API Docs page
 * (src/components/ApiDocs.tsx). Also the source for the endpoint reference in
 * GET /api/docs.md (server/src/docsMarkdown.ts). Hand-written and kept in sync
 * with server/src/routes/external.ts and server/src/lib/analytics.ts — there's
 * no runtime introspection here.
 */

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
})

const unauthorized = errorResponse('Missing, invalid, or revoked API key')

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LiftLogbook External API',
    version: '1.0.0',
    description:
      'Read-only access to a single user\'s workout data, for trusted integrations ' +
      '(e.g. the LiftLogbook MCP server). Authenticate with an API key created on the ' +
      'API Docs page, sent as a Bearer token. This is a separate credential from your ' +
      'account password/JWT and only grants read access to these endpoints. ' +
      'All weights are in pounds (lbs), regardless of the user\'s display unit.',
  },
  servers: [{ url: '/api/external' }],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Account', description: 'Who the API key belongs to' },
    { name: 'Workouts', description: 'Logged workout sessions and their sets' },
    { name: 'Exercises', description: 'The exercise catalog that workouts reference' },
    { name: 'Analytics', description: 'Values computed from the full workout history' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'An API key created on the API Docs page, e.g. "llb_...".',
      },
    },
    schemas: {
      Exercise: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Referenced by `exerciseId` in workouts', example: 'builtin-0' },
          name: { type: 'string', example: 'Barbell Bench Press' },
          muscleGroup: {
            type: 'string',
            enum: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Glutes', 'Calves', 'Forearms', 'Full Body'],
            example: 'Chest',
          },
          custom: { type: 'boolean', description: 'True for exercises the user created; omitted on built-ins' },
          isBodyweight: { type: 'boolean', description: 'True for bodyweight movements (pull-ups, dips, …); may be omitted' },
        },
      },
      SetEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reps: { type: 'number', example: 8 },
          weight: {
            type: 'number',
            description: 'Load in lbs. For bodyweight sets this is only the added weight (0 = bodyweight alone).',
            example: 185,
          },
          isBodyweight: { type: 'boolean', description: 'True when `weight` is added on top of bodyweight' },
        },
      },
      WorkoutExercise: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          exerciseId: { type: 'string', example: 'builtin-0' },
          sets: { type: 'array', items: { $ref: '#/components/schemas/SetEntry' } },
        },
      },
      Workout: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          date: { type: 'string', format: 'date', description: 'Calendar date of the session, no time or timezone', example: '2026-10-01' },
          name: { type: 'string', example: 'Push Day' },
          notes: { type: 'string', description: 'Omitted when empty' },
          exercises: { type: 'array', items: { $ref: '#/components/schemas/WorkoutExercise' } },
        },
      },
      PersonalRecord: {
        type: 'object',
        description: 'All-time bests for one exercise. Weights in lbs.',
        properties: {
          exerciseId: { type: 'string', example: 'builtin-0' },
          exercise: { $ref: '#/components/schemas/Exercise' },
          isBodyweight: { type: 'boolean', description: 'True if any logged set of this exercise was a bodyweight set' },
          heaviestWeight: {
            type: 'number',
            description: 'Heaviest logged `weight` (for bodyweight exercises: most added weight). Ties go to more reps.',
            example: 225,
          },
          heaviestWeightReps: { type: 'number', example: 3 },
          heaviestWeightDate: { type: 'string', format: 'date' },
          mostReps: { type: 'number', description: 'Most reps in a single set. Ties go to heavier effective weight.', example: 15 },
          mostRepsWeight: { type: 'number', description: 'Effective weight of that set (bodyweight included)' },
          mostRepsDate: { type: 'string', format: 'date' },
          best1RM: {
            type: 'number',
            description: 'Best estimated one-rep max, Epley formula: effectiveWeight × (1 + reps / 30). Not rounded.',
            example: 246.67,
          },
          best1RMDate: { type: 'string', format: 'date' },
          bestVolume: { type: 'number', description: 'Most total volume (Σ effectiveWeight × reps) for this exercise in one workout' },
          bestVolumeDate: { type: 'string', format: 'date' },
        },
      },
      AnalyticsSummary: {
        type: 'object',
        properties: {
          totalWorkouts: { type: 'integer', example: 142 },
          currentStreak: { type: 'integer', description: 'Consecutive days with a workout ending today (UTC); 0 if none today', example: 0 },
          longestStreak: { type: 'integer', description: 'Longest run of consecutive workout days ever', example: 4 },
          avgWorkoutsPerWeek: { type: 'number', description: 'Workouts ÷ weeks between first and last workout, 1 decimal', example: 3.4 },
          volumeByMuscleGroup: {
            type: 'array',
            description: 'All-time volume per muscle group (lbs), highest first',
            items: {
              type: 'object',
              properties: {
                muscleGroup: { type: 'string', example: 'Chest' },
                volume: { type: 'integer', example: 512340 },
              },
            },
          },
          topExercisesByVolume: {
            type: 'array',
            description: 'Up to 20 exercises by all-time volume (lbs), highest first',
            items: {
              type: 'object',
              properties: {
                exerciseName: { type: 'string', example: 'Barbell Bench Press' },
                muscleGroup: { type: 'string', example: 'Chest' },
                volume: { type: 'integer', example: 201450 },
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Unauthorized' } },
      },
    },
  },
  paths: {
    '/profile': {
      get: {
        tags: ['Account'],
        summary: 'Get the authenticated user\'s profile',
        description: 'Returns the key owner\'s email, sign-up date, settings, and workout count. ' +
          '`settings.weightUnit` is only a display preference; API weights are always lbs.',
        operationId: 'getProfile',
        responses: {
          '200': {
            description: 'Profile for the key\'s owner',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'you@example.com' },
                    memberSince: { type: 'string', format: 'date-time' },
                    settings: {
                      type: 'object',
                      properties: {
                        weightUnit: { type: 'string', enum: ['lbs', 'kg'], description: 'Display unit in the app only' },
                        bodyweightLbs: { type: 'number', description: 'User\'s bodyweight in lbs, if set. Used in bodyweight-set math.' },
                      },
                    },
                    totalWorkouts: { type: 'integer', example: 142 },
                  },
                },
              },
            },
          },
          '401': unauthorized,
        },
      },
    },
    '/workouts': {
      get: {
        tags: ['Workouts'],
        summary: 'List workouts',
        description: 'Returns full workouts (with every set), most recent first. There is no pagination; ' +
          'use `since` and/or `limit` to keep responses small.',
        operationId: 'listWorkouts',
        parameters: [
          {
            name: 'since',
            in: 'query',
            description: 'Only return workouts on or after this ISO date (YYYY-MM-DD)',
            schema: { type: 'string', format: 'date', example: '2026-09-01' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of workouts to return (most recent first). Applied after `since`.',
            schema: { type: 'integer', minimum: 1, example: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Workouts, most recent first',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Workout' } } } },
          },
          '401': unauthorized,
        },
      },
    },
    '/workouts/{id}': {
      get: {
        tags: ['Workouts'],
        summary: 'Get a single workout',
        operationId: 'getWorkout',
        parameters: [{ name: 'id', in: 'path', required: true, description: 'Workout `id` from the list endpoint', schema: { type: 'string' } }],
        responses: {
          '200': { description: 'The workout', content: { 'application/json': { schema: { $ref: '#/components/schemas/Workout' } } } },
          '401': unauthorized,
          '404': errorResponse('Workout not found'),
        },
      },
    },
    '/exercises': {
      get: {
        tags: ['Exercises'],
        summary: 'List exercises (built-in + custom)',
        description: 'The full catalog visible to the user. Use it to turn a workout\'s `exerciseId` into a name and muscle group.',
        operationId: 'listExercises',
        responses: {
          '200': {
            description: 'All exercises visible to the user',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Exercise' } } } },
          },
          '401': unauthorized,
        },
      },
    },
    '/personal-records': {
      get: {
        tags: ['Analytics'],
        summary: 'Get personal records per exercise',
        description: 'All-time bests for every exercise with at least one logged set, computed from the full history.',
        operationId: 'getPersonalRecords',
        responses: {
          '200': {
            description: 'One record object per exercise with a logged set',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PersonalRecord' } } } },
          },
          '401': unauthorized,
        },
      },
    },
    '/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Get aggregate workout analytics',
        description: 'Totals, streaks, and all-time volume breakdowns. Always covers the full history (no date filter).',
        operationId: 'getAnalyticsSummary',
        responses: {
          '200': {
            description: 'Streaks, volume breakdowns, and top exercises',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyticsSummary' } } },
          },
          '401': unauthorized,
        },
      },
    },
  },
} as const
