import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import * as ts from 'typescript'
import { parseClaims } from './claim-registry'
import { generatedValues, renderClaims } from './generate-claims'

export type ClaimCheckResult = {
  claimIds: string[]
  errors: string[]
}

type AppSource = { fileName: string; source: string }

/** The accessors of the generated module; each call names a claim the site shows. */
const CLAIM_ACCESSORS = ['claim', 'paperCard', 'paperCards']

const claimCallIds = (source: string, fileName: string): string[] => {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true)
  const ids: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      CLAIM_ACCESSORS.includes(node.expression.text) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      ids.push(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return ids
}

const templateClaimIds = (source: string): string[] => {
  const ids: string[] = []
  const callPattern = /\b(?:claim|paperCards?)\(\s*(['"])([^'"]+)\1\s*\)/gu
  for (const match of source.matchAll(callPattern)) ids.push(match[2])
  return ids
}

const appClaimIds = (sources: AppSource[]): string[] =>
  sources.flatMap(({ fileName, source }) => {
    if (!fileName.endsWith('.vue')) return claimCallIds(source, fileName)
    const scriptSources = source.match(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gu) ?? []
    return [
      ...scriptSources.flatMap((block) =>
        claimCallIds(block.replace(/^<script(?:\s[^>]*)?>|<\/script>$/gu, ''), fileName),
      ),
      ...templateClaimIds(source),
    ]
  })

const storyClaimIds = (source: string): string[] => {
  const ids: string[] = []
  const linkPattern = /\[([a-z0-9-]+)\]\(\.\.\/evidence\/claims\.toml\)/gu
  for (const match of source.matchAll(linkPattern)) ids.push(match[1])
  return ids
}

const validateClaimIds = (registryText: string, claimIds: string[]): ClaimCheckResult => {
  const claims = parseClaims(registryText)
  const byId = new Map(claims.map((claim) => [claim.id, claim]))
  const uniqueIds = [...new Set(claimIds)]
  const errors = uniqueIds.flatMap((id) => {
    const claim = byId.get(id)
    if (!claim) return [`claim id is unknown: ${id}`]
    if (claim.status !== 'verified') return [`claim id is not verified: ${id}`]
    return []
  })
  return { claimIds: uniqueIds, errors }
}

const UNREADABLE = Symbol('unreadable')

/** The value of a literal of strings, arrays and nested objects, or UNREADABLE for anything else. */
const literalValue = (node: ts.Expression): unknown => {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isArrayLiteralExpression(node)) {
    const items = node.elements.map((element) => literalValue(element))
    return items.includes(UNREADABLE) ? UNREADABLE : items
  }
  if (!ts.isObjectLiteralExpression(node)) return UNREADABLE
  const entries: [string, unknown][] = []
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) return UNREADABLE
    const key = property.name
    if (!(ts.isStringLiteral(key) || ts.isIdentifier(key) || ts.isNumericLiteral(key))) {
      return UNREADABLE
    }
    const value = literalValue(property.initializer)
    if (value === UNREADABLE) return UNREADABLE
    entries.push([key.text, value])
  }
  return Object.fromEntries(entries)
}

const generatedConstants = (source: string): Record<string, unknown> => {
  const file = ts.createSourceFile('claims.ts', source, ts.ScriptTarget.Latest, true)
  const constants: Record<string, unknown> = {}
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      constants[node.name.text] = literalValue(node.initializer)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return constants
}

const generatedClaimsMatchRegistry = (registryText: string, generatedSource: string): boolean => {
  const actual = generatedConstants(generatedSource)
  return Object.entries(generatedValues(registryText)).every(
    ([name, expected]) => JSON.stringify(actual[name]) === JSON.stringify(expected),
  )
}

export const checkClaims = (
  registryText: string,
  appSources: AppSource[],
  story: string,
  generatedSource?: string,
) => {
  const result = validateClaimIds(registryText, [
    ...appClaimIds(appSources),
    ...storyClaimIds(story),
  ])
  if (
    generatedSource !== undefined &&
    !generatedClaimsMatchRegistry(registryText, generatedSource)
  ) {
    result.errors.push('generated claims differ from registry')
  }
  return result
}

const sourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return sourceFiles(path)
      return /\.(ts|vue)$/u.test(entry.name) ? [path] : []
    }),
  )
  return nested.flat(2)
}

type SiteSources = {
  registry?: string
  appSources?: AppSource[]
  story?: string
  generatedClaims?: string
}

export const checkSiteClaims = async (fixtures?: SiteSources) => {
  const root = process.cwd()
  const registry =
    fixtures?.registry ?? (await readFile(resolve(root, '../evidence/claims.toml'), 'utf8'))
  const appSources =
    fixtures?.appSources ??
    (await Promise.all(
      (await sourceFiles(join(root, 'app'))).map(async (fileName) => ({
        fileName,
        source: await readFile(fileName, 'utf8'),
      })),
    ))
  const story = fixtures?.story ?? (await readFile(resolve(root, '../docs/story.md'), 'utf8'))
  const generatedClaims =
    fixtures?.generatedClaims ??
    (fixtures?.registry
      ? renderClaims(registry)
      : await readFile(resolve(root, 'app/data/claims.ts'), 'utf8'))
  return checkClaims(registry, appSources, story, generatedClaims)
}

if (import.meta.main) {
  const result = await checkSiteClaims()
  if (result.errors.length) {
    for (const error of result.errors) console.error(error)
    process.exitCode = 1
  } else {
    console.log(`claim check passed: ${result.claimIds.length} verified claim ids`)
  }
}
