#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as readline from 'node:readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const skillsDir = path.join(__dirname, '..', 'skills')

const args = process.argv.slice(2)
const cmd = args[0]
const positional = []
const flags = {}
for (const arg of args.slice(1)) {
  if (arg.startsWith('--')) {
    const eq = arg.indexOf('=')
    if (eq > -1) {
      flags[arg.slice(0, eq)] = arg.slice(eq + 1)
    } else {
      flags[arg] = true
    }
  } else {
    positional.push(arg)
  }
}

const allSkills = fs.readdirSync(skillsDir).filter(
  (d) => fs.statSync(path.join(skillsDir, d)).isDirectory() &&
       fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))
)

// ---- tool target presets ----
const TOOL_PRESETS = {
  'claude-code': {
    label: 'Claude Code',
    defaultDir: '.claude/skills',
    desc: '安装到 .claude/skills/ 目录，Claude Code 会自动加载',
    fileLayout: 'dir',  // each skill = directory/<name>/SKILL.md
  },
  cursor: {
    label: 'Cursor',
    defaultDir: '.cursor/rules',
    desc: '安装到 .cursor/rules/ 目录，Cursor 会自动加载 .mdc 规则文件',
    fileLayout: 'flat', // each skill = single <name>.mdc file
  },
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function printHelp() {
  console.log(`
hykj-skills — 将 @hykj-js 的技能文档安装到工程中

用法:
  npx @hykj-js/skills add <name>       安装指定技能
  npx @hykj-js/skills add --all        安装全部技能
  npx @hykj-js/skills list             列出可用技能

选项:
  --target=<tool>    目标工具格式，默认 claude-code
                     支持: claude-code, cursor
  --dir=<path>       自定义安装目录（覆盖工具默认目录）

示例:
  npx @hykj-js/skills add hykj-http
  npx @hykj-js/skills add --all --target=cursor
  npx @hykj-js/skills add hykj-http --dir=./my-rules

技能安装到工程后，AI 编程助手在生成代码时会参考这些文档，
确保 API 调用、组件使用方式与 @hykj-js 库保持一致。
`)
}

if (cmd === 'list') {
  console.log('可用技能:\n')
  for (const s of allSkills) {
    const file = path.join(skillsDir, s, 'SKILL.md')
    const content = fs.readFileSync(file, 'utf8')
    const m = content.match(/^description:\s*(.+)$/m)
    const desc = m ? m[1].trim() : '(无描述)'
    console.log(`  ${s}`)
    console.log(`    ${desc}\n`)
  }
  process.exit(0)
}

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  printHelp()
  process.exit(0)
}

if (cmd !== 'add') {
  console.error(`未知命令: ${cmd}。运行 npx @hykj-js/skills help 查看用法。`)
  process.exit(1)
}

// ---- add command ----
const targetName = positional[0]
const toInstall = targetName === '--all' ? allSkills : [targetName].filter(Boolean)

if (!toInstall.length) {
  console.error('请指定要安装的技能名称，或使用 --all 安装全部。')
  console.error('运行 npx @hykj-js/skills list 查看可用技能。')
  process.exit(1)
}

for (const name of toInstall) {
  if (!allSkills.includes(name)) {
    console.error(`未知技能: ${name}`)
    console.error('运行 npx @hykj-js/skills list 查看可用技能。')
    process.exit(1)
  }
}

// Resolve tool preset
const toolKey = flags['--target'] || 'claude-code'
const tool = TOOL_PRESETS[toolKey]
if (!tool) {
  console.error(`不支持的目标工具: ${toolKey}。支持: ${Object.keys(TOOL_PRESETS).join(', ')}`)
  process.exit(1)
}

// Resolve target directory
let destBase = flags['--dir'] || tool.defaultDir
if (!path.isAbsolute(destBase)) {
  destBase = path.join(process.cwd(), destBase)
}

// Interactive confirmation
console.log(`\n🎯 目标工具: ${tool.label}`)
console.log(`📁 安装目录: ${destBase}`)
console.log(`📦 待安装技能 (${toInstall.length}): ${toInstall.join(', ')}`)
console.log(`\n${tool.desc}`)
console.log('这些技能文档将帮助 AI 编程助手正确使用 @hykj-js 系列库。')

const confirm = flags['--yes'] || flags['-y']
if (!confirm) {
  const answer = await prompt('\n是否继续安装? (y/n) ')
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('已取消安装。')
    process.exit(0)
  }
}

// Install
fs.mkdirSync(destBase, { recursive: true })

for (const name of toInstall) {
  const src = path.join(skillsDir, name, 'SKILL.md')
  const content = fs.readFileSync(src, 'utf8')

  if (tool.fileLayout === 'dir') {
    // Claude Code: .claude/skills/<name>/SKILL.md
    const destDir = path.join(destBase, name)
    fs.mkdirSync(destDir, { recursive: true })
    fs.writeFileSync(path.join(destDir, 'SKILL.md'), content)
  } else if (tool.fileLayout === 'flat') {
    // Cursor: .cursor/rules/<name>.mdc
    const cursorContent = convertToCursorRule(content, name)
    fs.writeFileSync(path.join(destBase, `${name}.mdc`), cursorContent)
  }

  console.log(`  ✓ ${name}`)
}

console.log(`\n已安装 ${toInstall.length} 个技能到 ${destBase}`)
console.log('AI 编程助手现在可以在编码时参考这些规则文档。')

// ---- helpers ----

function convertToCursorRule(mdContent, name) {
  // Extract frontmatter from SKILL.md
  const fmMatch = mdContent.match(/^---\n([\s\S]*?)\n---/)
  let desc = ''
  if (fmMatch) {
    const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m)
    if (descMatch) desc = descMatch[1].trim()
  }

  const body = fmMatch ? mdContent.slice(fmMatch[0].length).trim() : mdContent

  return `---
description: ${desc || name}
globs: **/*.{ts,tsx,vue,js,jsx}
alwaysApply: false
---

${body}
`
}
