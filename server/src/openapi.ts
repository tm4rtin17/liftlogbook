/**
 * Static OpenAPI 3.0 spec for the read-only /api/external surface, served at
 * GET /api/openapi.json and rendered by Swagger UI on the in-app API Docs page
 * (src/components/ApiDocs.tsx). Hand-written and kept in sync with
 * server/src/routes/external.ts — there's no runtime introspection here.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LiftLogbook External API',
    version: '1.0.0',
    description:
      'Read-only access to a single user\'s workout data, for trusted integrations ' +
      '(e.g. the LiftLogbook MCP server). Authenticate with an API key created on the ' +
      'API Docs page, sent as a Bearer token. This is a separate credential from your ' +
      'account password/JWT and only grants read access to these endpoints.',
  },
  servers: [{ url: '/api/external' }],
  security: [{ bearerAuth: [] }],
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
          id: { type: 'string' },
          name: { type: 'string' },
          muscleGroup: { type: 'string' },
          custom: { type: 'boolean' },
        },
      },
      SetEntry: {
        type: 'object',
        properties: {
          reps: { type: 'number' },
          weight: { type: 'number' },
        },
      },
      WorkoutExercise: {
        type: 'object',
        properties: {
          exerciseId: { type: 'string' },
          sets: { type: 'array', items: { $ref: '#/components/schemas/SetEntry' } },
        },
      },
      Workout: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          date: { type: 'string', format: 'date' },
          name: { type: 'string' },
          notes: { type: 'string' },
          exercises: { type: 'array', items: { $ref: '#/components/schemas/WorkoutExercise' } },
        },
      },
      PersonalRecord: {
        type: 'object',
        properties: {
          exerciseId: { type: 'string' },
          exercise: { $ref: '#/components/schemas/Exercise' },
          weight: { type: 'number' },
          reps: { type: 'number' },
          date: { type: 'string', format: 'date' },
        },
      },
      AnalyticsSummary: {
        type: 'object',
        properties: {
          totalWorkouts: { type: 'integer' },
          currentStreak: { type: 'integer' },
          longestStreak: { type: 'integer' },
          avgWorkoutsPerWeek: { type: 'number' },
          volumeByMuscleGroup: { type: 'object', additionalProperties: { type: 'number' } },
          topExercisesByVolume: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                exerciseId: { type: 'string' },
                volume: { type: 'number' },
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  paths: {
    '/profile': {
      get: {
        summary: 'Get the authenticated user\'s profile',
        operationId: 'getProfile',
        responses: {
          '200': {
            description: 'Profile for the key\'s owner',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    memberSince: { type: 'string', format: 'date-time' },
                    settings: { type: 'object' },
                    totalWorkouts: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { description: 'Missing or invalid API key', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/workouts': {
      get: {
        summary: 'List workouts',
        operationId: 'listWorkouts',
        parameters: [
          {
            name: 'since',
            in: 'query',
            description: 'Only return workouts on or after this ISO date (YYYY-MM-DD)',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of workouts to return (most recent first)',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'Workouts, most recent first',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Workout' } } } },
          },
          '401': { description: 'Missing or invalid API key' },
        },
      },
    },
    '/workouts/{id}': {
      get: {
        summary: 'Get a single workout',
        operationId: 'getWorkout',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'The workout', content: { 'application/json': { schema: { $ref: '#/components/schemas/Workout' } } } },
          '404': { description: 'Workout not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/exercises': {
      get: {
        summary: 'List exercises (built-in + custom)',
        operationId: 'listExercises',
        responses: {
          '200': {
            description: 'All exercises visible to the user',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Exercise' } } } },
          },
        },
      },
    },
    '/personal-records': {
      get: {
        summary: 'Get personal records per exercise',
        operationId: 'getPersonalRecords',
        responses: {
          '200': {
            description: 'One PR per exercise with a logged set',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PersonalRecord' } } } },
          },
        },
      },
    },
    '/analytics/summary': {
      get: {
        summary: 'Get aggregate workout analytics',
        operationId: 'getAnalyticsSummary',
        responses: {
          '200': {
            description: 'Streaks, volume breakdowns, and top exercises',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyticsSummary' } } },
          },
        },
      },
    },
  },
} as const
