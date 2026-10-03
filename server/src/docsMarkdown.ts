/**
 * Builds the Markdown served at GET /api/docs.md: the hand-written guide
 * (apiGuide.ts) followed by an endpoint + schema reference generated from
 * openApiSpec, so the copied docs can't drift from what Swagger shows.
 *
 * Resource usage: pure string building over a ~200-line spec, well under a
 * millisecond. Cheap enough to build per request, so there's no cache.
 */
import { apiGuideMarkdown } from './apiGuide'
import { openApiSpec } from './openapi'

// The spec is `as const`; walk it loosely rather than fighting deep readonly types.
type Schema = {
  $ref?: string
  type?: string
  format?: string
  enum?: readonly string[]
  description?: string
  items?: Schema
  properties?: Record<string, Schema>
  additionalProperties?: Schema
}

const spec = openApiSpec as unknown as {
  paths: Record<string, Record<string, {
    summary: string
    description?: string
    parameters?: { name: string; in: string; required?: boolean; description?: string; schema: Schema }[]
    responses: Record<string, { description: string; content?: Record<string, { schema: Schema }> }>
  }>>
  components: { schemas: Record<string, Schema> }
}

function refName(ref: string): string {
  return ref.split('/').pop()!
}

/** Short type label for a table cell, e.g. `Workout[]`, `string (date)`. */
function typeLabel(s: Schema): string {
  if (s.$ref) return refName(s.$ref)
  if (s.type === 'array' && s.items) {
    const inner = typeLabel(s.items)
    return inner === 'object' ? 'object[]' : `${inner}[]`
  }
  if (s.enum) return s.enum.map((v) => `"${v}"`).join(' \\| ')
  return s.format ? `${s.type} (${s.format})` : s.type ?? 'any'
}

function cell(text: string | undefined): string {
  return (text ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

/** Field table for an object schema; nested inline objects get a dotted path. */
function fieldRows(s: Schema, prefix = ''): string[] {
  const rows: string[] = []
  for (const [name, prop] of Object.entries(s.properties ?? {})) {
    const path = prefix + name
    rows.push(`| \`${path}\` | \`${typeLabel(prop)}\` | ${cell(prop.description)} |`)
    if (prop.properties) rows.push(...fieldRows(prop, `${path}.`))
    if (prop.type === 'array' && prop.items?.properties) rows.push(...fieldRows(prop.items, `${path}[].`))
  }
  return rows
}

function fieldTable(s: Schema): string {
  return ['| Field | Type | Description |', '|---|---|---|', ...fieldRows(s)].join('\n')
}

function endpointSection(path: string, method: string, op: (typeof spec.paths)[string][string]): string {
  const out = [`### ${method.toUpperCase()} ${path}`, '', op.summary + '.']
  if (op.description) out.push('', op.description)

  if (op.parameters?.length) {
    out.push('', '| Parameter | In | Type | Description |', '|---|---|---|---|')
    for (const p of op.parameters) {
      const req = p.required ? ' (required)' : ''
      out.push(`| \`${p.name}\` | ${p.in}${req} | \`${typeLabel(p.schema)}\` | ${cell(p.description)} |`)
    }
  }

  out.push('', '**Responses**', '')
  let inlineSchema: Schema | undefined
  for (const [status, r] of Object.entries(op.responses)) {
    const schema = r.content?.['application/json']?.schema
    out.push(`- \`${status}\`: ${r.description}${schema ? ` → \`${typeLabel(schema)}\`` : ''}`)
    if (status === '200' && schema?.properties) inlineSchema = schema
  }
  // Inline (non-$ref) object responses have no schema section below, so document them here.
  if (inlineSchema) out.push('', '`200` response fields:', '', fieldTable(inlineSchema))
  return out.join('\n')
}

export function buildDocsMarkdown(baseUrl: string): string {
  const parts = [apiGuideMarkdown(baseUrl).trimEnd(), '', '---', '', '## Endpoint reference', '']
  parts.push(`All paths are relative to \`${baseUrl}/api/external\`. Every endpoint requires \`Authorization: Bearer <key>\`.`, '')

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      parts.push(endpointSection(path, method, op), '')
    }
  }

  parts.push('## Schemas', '')
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    parts.push(`### ${name}`, '')
    if (schema.description) parts.push(schema.description, '')
    parts.push(fieldTable(schema), '')
  }

  return parts.join('\n')
}
