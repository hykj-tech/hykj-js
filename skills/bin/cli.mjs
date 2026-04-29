#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const skillsDir = path.join(__dirname, '..', 'skills')

const args = process.argv.slice(2)
const cmd = args[0]
const target = args[1]

const allSkills = fs.readdirSync(skillsDir).filter(
  (d) => fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))
)

if (cmd === 'list') {
  console.log('Available skills:\n' + allSkills.map((s) => `  ${s}`).join('\n'))
  process.exit(0)
}

if (cmd !== 'add') {
  console.log(`Usage:
  npx @hykj-js/skills add <skill-name>   Install one skill
  npx @hykj-js/skills add --all          Install all skills
  npx @hykj-js/skills list               List available skills`)
  process.exit(1)
}

const toInstall = target === '--all' ? allSkills : [target]

for (const name of toInstall) {
  if (!allSkills.includes(name)) {
    console.error(`Unknown skill: ${name}. Run "npx @hykj-js/skills list" to see all.`)
    process.exit(1)
  }
}

const destBase = path.join(process.cwd(), '.claude', 'skills')
fs.mkdirSync(destBase, { recursive: true })

for (const name of toInstall) {
  const src = path.join(skillsDir, name, 'SKILL.md')
  const destDir = path.join(destBase, name)
  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(src, path.join(destDir, 'SKILL.md'))
  console.log(`✓ ${name}`)
}

console.log(`\nInstalled ${toInstall.length} skill(s) to .claude/skills/`)
