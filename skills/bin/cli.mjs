#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as readline from 'node:readline'
import { Command } from 'commander'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const skillsDir = path.join(__dirname, '..', 'skills')

// ---- tool target presets ----
const TOOL_PRESETS = {
  'claude-code': {
    label: 'Claude Code',
    defaultDir: '.claude/skills',
    desc: '.claude/skills/ 目录，Claude Code 会自动加载',
    fileLayout: 'dir',
  },
  cursor: {
    label: 'Cursor',
    defaultDir: '.cursor/rules',
    desc: '.cursor/rules/ 目录，生成 .mdc 规则文件',
    fileLayout: 'flat',
    fileExt: '.mdc',
    transform: convertToCursorRule,
  },
  codex: {
    label: 'Codex CLI',
    defaultDir: '.agents/skills',
    desc: '.agents/skills/ 目录，Codex CLI / SDK 会自动加载',
    fileLayout: 'dir',
  },
  gemini: {
    label: 'Gemini CLI',
    defaultDir: '.gemini/skills',
    desc: '.gemini/skills/ 目录，Gemini CLI 会自动加载 .md 规则文件',
    fileLayout: 'flat',
    fileExt: '.md',
  },
  copilot: {
    label: 'GitHub Copilot',
    defaultDir: '.github/copilot-instructions',
    desc: '.github/copilot-instructions/ 目录，Copilot 会拼接所有 .md 作为自定义指令',
    fileLayout: 'flat',
    fileExt: '.md',
  },
}

const TARGET_CHOICES = Object.keys(TOOL_PRESETS)

// ---- helpers ----

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function loadSkills() {
  return fs.readdirSync(skillsDir).filter(
    (d) => fs.statSync(path.join(skillsDir, d)).isDirectory() &&
         fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))
  )
}

function getSkillDesc(name) {
  const content = fs.readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf8')
  const m = content.match(/^description:\s*(.+)$/m)
  return m ? m[1].trim() : '(无描述)'
}

function resolveDest(toolKey, customDir) {
  if (customDir) {
    return path.isAbsolute(customDir) ? customDir : path.join(process.cwd(), customDir)
  }
  const preset = TOOL_PRESETS[toolKey]
  return path.join(process.cwd(), preset.defaultDir)
}

function convertToCursorRule(mdContent, name) {
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

// ---- install logic ----

async function installSkills(names, toolKey, destBase, skipConfirm) {
  const allSkills = loadSkills()
  const toInstall = names[0] === '--all' ? allSkills : names

  // validate
  for (const name of toInstall) {
    if (!allSkills.includes(name)) {
      console.error(`未知技能: ${name}`)
      console.error('运行 hykj-skills list 查看可用技能。')
      process.exit(1)
    }
  }

  const tool = TOOL_PRESETS[toolKey]

  // confirm
  console.log(`\n目标工具: ${tool.label}`)
  console.log(`安装目录: ${destBase}`)
  console.log(`待安装技能 (${toInstall.length}): ${toInstall.join(', ')}`)
  console.log(`\n${tool.desc}`)
  console.log('这些技能文档将帮助 AI 编程助手正确使用 @hykj-js 系列库。')

  if (!skipConfirm) {
    const answer = await prompt('\n是否继续安装? (y/n) ')
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('已取消安装。')
      process.exit(0)
    }
  }

  // install
  fs.mkdirSync(destBase, { recursive: true })

  for (const name of toInstall) {
    const src = path.join(skillsDir, name, 'SKILL.md')
    const content = fs.readFileSync(src, 'utf8')

    if (tool.fileLayout === 'dir') {
      const destDir = path.join(destBase, name)
      fs.mkdirSync(destDir, { recursive: true })
      fs.writeFileSync(path.join(destDir, 'SKILL.md'), content)
    } else {
      const ext = tool.fileExt || '.md'
      const output = tool.transform ? tool.transform(content, name) : content
      fs.writeFileSync(path.join(destBase, `${name}${ext}`), output)
    }

    console.log(`  ✓ ${name}`)
  }

  console.log(`\n已安装 ${toInstall.length} 个技能到 ${destBase}`)
  console.log('AI 编程助手现在可以在编码时参考这些规则文档。')
}

// ---- CLI setup ----

const program = new Command()

program
  .name('hykj-skills')
  .description('将 @hykj-js 的技能文档安装到工程中，AI 编程助手在生成代码时会参考这些文档')
  .version('0.1.0')

program
  .command('list')
  .description('列出所有可用技能')
  .action(() => {
    const allSkills = loadSkills()
    console.log('可用技能:\n')
    for (const s of allSkills) {
      console.log(`  ${s}`)
      console.log(`    ${getSkillDesc(s)}\n`)
    }
  })

program
  .command('add')
  .description('安装技能到工程')
  .argument('<names...>', '技能名称，或 --all 安装全部')
  .option('-t, --target <tool>', '目标工具格式', 'claude-code')
  .option('-d, --dir <path>', '自定义安装目录（覆盖工具默认目录）')
  .option('-y, --yes', '跳过交互确认')
  .action(async (names, options) => {
    const { target, dir, yes } = options

    if (!TARGET_CHOICES.includes(target)) {
      console.error(`不支持的目标工具: ${target}`)
      console.error(`支持: ${TARGET_CHOICES.join(', ')}`)
      process.exit(1)
    }

    const destBase = resolveDest(target, dir)
    await installSkills(names, target, destBase, yes)
  })

// add --target as a global option for convenience
program
  .command('targets')
  .description('列出支持的目标工具及说明')
  .action(() => {
    console.log('支持的目标工具:\n')
    for (const [key, t] of Object.entries(TOOL_PRESETS)) {
      console.log(`  ${key}`)
      console.log(`    ${t.label} — ${t.desc}\n`)
    }
  })

program.parse()
