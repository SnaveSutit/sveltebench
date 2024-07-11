if (process.argv.includes('--mode=dev')) {
	process.env.NODE_ENV = 'development'
} else {
	process.env.NODE_ENV = 'production'
}

process.env.FLAVOR ??= `local`

import * as fs from 'fs'
import * as esbuild from 'esbuild'
import sveltePlugin from './plugins/sveltePlugin'
import svelteConfig from '../svelte.config.js'
import inlineImage from 'esbuild-plugin-inline-image'
import ImportGlobPlugin from 'esbuild-plugin-import-glob'
import * as path from 'path'
const PACKAGE = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const INFO_PLUGIN: esbuild.Plugin = {
	name: 'infoPlugin',
	setup(build) {
		let start = Date.now()
		build.onStart(() => {
			console.log('\u{1F528} Building...')
			start = Date.now()
		})

		build.onEnd(result => {
			const end = Date.now()
			const diff = end - start
			console.log(
				`\u{2705} Build completed in ${diff}ms with ${result.warnings.length} warning${
					result.warnings.length == 1 ? '' : 's'
				} and ${result.errors.length} error${result.errors.length == 1 ? '' : 's'}.`
			)
		})
	},
}
const DEPENDENCY_QUARKS: esbuild.Plugin = {
	name: 'dependency-quarks',
	setup(build) {
		build.onResolve({ filter: /^three/ }, args => {
			if (args.path === 'three') {
				return { path: 'three', external: true }
			} else {
				return {
					path: require.resolve(args.path),
				}
			}
		})
		build.onResolve({ filter: /^deepslate\// }, args => {
			// esbuild respects the package.json "exports" field
			// but the version of typescript we're using doesn't
			// so we need to resolve the path manually
			const file_path = path.resolve(
				process.cwd(),
				path.dirname(require.resolve('deepslate')),
				'..',
				args.path.split('/').slice(1).join('/'),
				'index.js'
			)
			return {
				path: file_path,
			}
		})
	},
}
function createBanner() {
	const LICENSE = fs.readFileSync('./LICENSE').toString()
	let lines: string[] = [
		``,
		`v${PACKAGE.version as string}`,
		``,
		PACKAGE.description,
		``,
		`Created by ${PACKAGE.author.name as string}`,
		`(${PACKAGE.author.email as string}) [${PACKAGE.author.url as string}]`,
		``,
		`[ SOURCE ]`,
		`${PACKAGE.repository.url as string}`,
		``,
		`[ LICENSE ]`,
		...LICENSE.split('\n').map(v => v.trim()),
	]

	const maxLength = Math.max(...lines.map(line => line.length))
	const leftBuffer = Math.floor(maxLength / 2)
	const rightBuffer = Math.ceil(maxLength / 2)

	const header = '╭' + `─`.repeat(maxLength + 2) + '╮'
	const footer = '╰' + `─`.repeat(maxLength + 2) + '╯'

	lines = lines.map(v => {
		const div = v.length / 2
		const l = Math.ceil(leftBuffer - div)
		const r = Math.floor(rightBuffer - div)
		return '│ ' + ' '.repeat(l) + v + ' '.repeat(r) + ' │'
	})

	const banner = '\n' + [header, ...lines, footer].map(v => `//?? ${v}`).join('\n') + '\n'

	return {
		js: banner,
	}
}

const DEFINES: Record<string, string> = {}

Object.entries(process.env).forEach(([key, value]) => {
	if (key.match(/[^A-Za-z0-9_]/i)) return
	DEFINES[`process.env.${key}`] = JSON.stringify(value)
})

const devConfig: esbuild.BuildOptions = {
	banner: createBanner(),
	entryPoints: ['./src/index.ts'],
	outfile: `./dist/${PACKAGE.name as string}.js`,
	bundle: true,
	minify: false,
	platform: 'node',
	sourcemap: 'inline',
	sourceRoot: 'http://animated-java/',
	loader: { '.svg': 'dataurl', '.ttf': 'binary', '.mcb': 'text' },
	plugins: [
		// @ts-ignore
		ImportGlobPlugin.default(),
		inlineImage({
			limit: -1,
		}),
		INFO_PLUGIN,
		sveltePlugin(svelteConfig),
		DEPENDENCY_QUARKS,
	],
	format: 'esm',
	define: DEFINES,
	treeShaking: true,
}

const prodConfig: esbuild.BuildOptions = {
	entryPoints: ['./src/index.ts'],
	outfile: `./dist/${PACKAGE.name as string}.js`,
	bundle: true,
	minify: true,
	platform: 'node',
	loader: { '.svg': 'dataurl', '.ttf': 'binary', '.mcb': 'text' },
	plugins: [
		// @ts-ignore
		ImportGlobPlugin.default(),
		inlineImage({
			limit: -1,
		}),
		INFO_PLUGIN,
		sveltePlugin(svelteConfig),
		DEPENDENCY_QUARKS,
	],
	keepNames: true,
	banner: createBanner(),
	drop: ['debugger'],
	format: 'esm',
	define: DEFINES,
	treeShaking: true,
	metafile: true,
}

async function buildDev() {
	const ctx = await esbuild.context(devConfig)
	await ctx.watch()
}

async function buildProd() {
	const result = await esbuild.build(prodConfig).catch(() => process.exit(1))
	if (result.errors.length > 0) {
		console.error(result.errors)
		process.exit(1)
	}
	if (result.warnings.length > 0) {
		console.warn(result.warnings)
	}
	fs.writeFileSync('./dist/meta.json', JSON.stringify(result.metafile, null, '\t'))
}

async function main() {
	if (process.env.NODE_ENV === 'development') {
		await buildDev()
		return
	}
	await buildProd()
}

void main()
