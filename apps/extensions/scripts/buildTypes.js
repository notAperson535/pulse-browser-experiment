/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as prettier from 'prettier'
import ts from 'typescript'

const {
  ListFormat,
  ScriptTarget,
  createSourceFile,
  NewLineKind,
  createPrinter,
  SyntaxKind,
  factory,
} = ts

/**
 * @typedef {object} Namespace
 * @property {string} namespace
 * @property {string} description
 * @property {Type[]} [types]
 * @property {FunctionType[]} [functions]
 */

/**
 * @typedef {object} ObjectType
 * @property {'object'} type
 * @property {Record<string, PropertyType>} [properties]
 */

/**
 * @typedef {object} FunctionType
 * @property {'function'} type
 * @property {string} name
 * @property {FunctionParamType[]} [parameters]
 * @property {PropertyType} [returns]
 * @property {boolean} [async]
 */

/**
 * @typedef {object} UnionType
 * @property {PropertyType[]} choices
 */

/**
 * @typedef {object} ArrayType
 * @property {'array'} type
 * @property {PropertyType} items
 */

/**
 * @typedef {object} StringType
 * @property {'string'} type
 * @property {{ name: string }[]} [enum]
 */

/**
 * @typedef {object} NumberType
 * @property {'number' | 'integer'} type
 */

/**
 * @typedef {object} BooleanType
 * @property {'boolean'} type
 */

/**
 * @typedef {{ '$ref': string }} RefType
 */

/**
 * @typedef {(ObjectType | FunctionType | UnionType | ArrayType | StringType | NumberType | BooleanType | RefType) & { optional?: boolean }} PropertyType
 * @typedef {PropertyType & { id: string }} Type
 * @typedef {PropertyType & { name: string }} FunctionParamType
 */

const schemaFolder = path.join(process.cwd(), 'lib', 'schemas')
const outFolder = path.join(process.cwd(), 'lib', 'schemaTypes')

const printer = createPrinter({
  newLine: NewLineKind.LineFeed,
  omitTrailingSemicolon: true,
})

const QUESTION_TOKEN = factory.createToken(SyntaxKind.QuestionToken)

for (const file of fs.readdirSync(schemaFolder)) {
  const fileName = file.replace('.json', '')
  let text = fs.readFileSync(path.join(schemaFolder, file), 'utf8')
  const sourceFile = createSourceFile(file, text, ScriptTarget.Latest)

  const header = `// @not-mpl
// This file is generated from '../schemas/${file}'. This file inherits its license
// Please check that file's license
//
// DO NOT MODIFY MANUALLY\n\n`

  {
    const startIndex = text.indexOf('[')
    text = text.slice(startIndex)
  }

  const namespaces = JSON.parse(text).map(
    (/** @type {Namespace} */ namespace) => {
      const block = factory.createModuleBlock([
        ...generateTypes(namespace.types || []),
        factory.createTypeAliasDeclaration(
          undefined,
          'ApiGetterReturn',
          undefined,
          generateApiGetter(namespace.functions || [], namespace.namespace),
        ),
      ])

      return factory.createModuleDeclaration(
        [factory.createToken(SyntaxKind.DeclareKeyword)],
        factory.createIdentifier(`${fileName}__${namespace.namespace}`),
        block,
      )
    },
  )

  fs.writeFileSync(
    path.join(outFolder, `${fileName}.d.ts`),
    await prettier.format(
      header + printer.printList(ListFormat.None, namespaces, sourceFile),
      { parser: 'typescript', semi: false, singleQuote: true },
    ),
  )
}

/**
 * @param {Type[]} types
 * @returns {import('typescript').TypeAliasDeclaration[]}
 */
function generateTypes(types) {
  return types
    .map((type) => {
      if (type.$extend) return null

      return factory.createTypeAliasDeclaration(
        undefined,
        type.id,
        undefined,
        generateTypeNode(type),
      )
    })
    .filter(Boolean)
}

/**
 * @param {FunctionType[]} functions
 * @param {string} apiName
 */
function generateApiGetter(functions, apiName) {
  return factory.createTypeLiteralNode([
    factory.createPropertySignature(
      undefined,
      factory.createIdentifier(apiName),
      undefined,
      factory.createTypeLiteralNode(
        functions.map((fn) =>
          factory.createPropertySignature(
            undefined,
            factory.createIdentifier(fn.name),
            undefined,
            generateTypeNode(fn),
          ),
        ),
      ),
    ),
  ])
}

/**
 * @param {PropertyType} type
 * @returns {type is RefType}
 */
function isRef(type) {
  /** @type {RefType} */
  // @ts-ignore
  const asRef = type
  return typeof asRef.$ref !== 'undefined'
}

/**
 * @param {PropertyType} type
 * @returns {type is UnionType}
 */
function isUnion(type) {
  /** @type {UnionType} */
  // @ts-ignore
  const asUnion = type
  return typeof asUnion.choices !== 'undefined'
}

/**
 * @param {PropertyType} type
 * @returns {import('typescript').TypeNode}
 */
function generateTypeNode(type) {
  if (isRef(type)) {
    return factory.createTypeReferenceNode(type.$ref)
  }

  if (isUnion(type)) {
    return factory.createUnionTypeNode(type.choices.map(generateTypeNode))
  }

  switch (type.type) {
    case 'object':
      return factory.createTypeLiteralNode(
        Object.entries(type.properties || {}).map(([name, type]) =>
          factory.createPropertySignature(
            undefined,
            factory.createIdentifier(name),
            typeof type.optional !== 'undefined' && type.optional
              ? QUESTION_TOKEN
              : undefined,
            generateTypeNode(type),
          ),
        ),
      )

    case 'function':
      return factory.createFunctionTypeNode(
        undefined,
        (type.parameters || []).map((param) =>
          factory.createParameterDeclaration(
            undefined,
            undefined,
            factory.createIdentifier(param.name),
            typeof param.optional !== 'undefined' && param.optional
              ? QUESTION_TOKEN
              : undefined,
            generateTypeNode(param),
          ),
        ),
        type.returns
          ? typeof type.async !== 'undefined' && type.async
            ? factory.createTypeReferenceNode(
                factory.createIdentifier('Promise'),
                [generateTypeNode(type.returns)],
              )
            : generateTypeNode(type.returns)
          : factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
      )

    case 'array':
      return factory.createArrayTypeNode(generateTypeNode(type.items))

    case 'string':
      if (type.enum) {
        return factory.createUnionTypeNode(
          type.enum.map((e) =>
            factory.createLiteralTypeNode(factory.createStringLiteral(e.name)),
          ),
        )
      }

      return factory.createKeywordTypeNode(SyntaxKind.StringKeyword)

    case 'number':
    case 'integer':
      return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword)

    case 'boolean':
      return factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword)
  }
}
