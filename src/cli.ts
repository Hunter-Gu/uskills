import fs from 'node:fs/promises';
import { existsSync, readdirSync, lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { intro, outro, multiselect, isCancel, cancel, spinner, log } from '@clack/prompts';
import matter from 'gray-matter';
import color from 'picocolors';
import { loadConfig } from 'c12';
import { parseArgs } from 'node:util';

// Default Configuration
export const DEFAULT_CONFIG = {
  sourceSkillsDir: '.uskills',
  targetDirs: ['.agent/skills', '.agents/skills'],
  clean: false,
};

export interface Config {
  sourceSkillsDir: string;
  targetDirs: string[];
  clean: boolean;
}

export interface SkillOption {
  label: string;
  value: string;
  hint: string;
}

/**
 * Scans the skills directory for valid skill folders and parses their SKILL.md
 */
export function getSkillOptions(skillsDir: string): SkillOption[] {
  if (!existsSync(skillsDir)) return [];

  const entries = readdirSync(skillsDir);
  const folders = entries.filter((entry) => {
    const fullPath = path.join(skillsDir, entry);
    try {
      return lstatSync(fullPath).isDirectory();
    } catch {
      return false;
    }
  });

  return folders.map((folder) => {
    let label = folder;
    let hint = '';
    try {
      const mdPath = path.join(skillsDir, folder, 'SKILL.md');
      if (existsSync(mdPath)) {
        const content = readFileSync(mdPath, 'utf-8');
        const parsed = matter(content);
        const { name, description } = parsed.data;

        label = name || folder;
        hint = description || '';
      }
    } catch (e) {
      // ignore reading/parsing errors
    }
    return { label, value: folder, hint };
  });
}

/**
 * Prepares target directories by optionally cleaning and ensuring they exist
 */
export async function prepareTargets(config: Config, rootDir: string, isCleanEnabled: boolean) {
  if (isCleanEnabled) {
    for (const targetDir of config.targetDirs) {
      await fs.rm(path.join(rootDir, targetDir), { recursive: true, force: true });
    }
  }

  for (const targetDir of config.targetDirs) {
    await fs.mkdir(path.join(rootDir, targetDir), { recursive: true });
  }
}

/**
 * Creates symlinks for selected skills
 */
export async function linkSelectedSkills(
  selectedSkills: string[],
  config: Config,
  rootDir: string,
  skillsDir: string
) {
  for (const skill of selectedSkills) {
    const sourcePath = path.join(skillsDir, skill);

    for (const targetDir of config.targetDirs) {
      const targetPath = path.join(rootDir, targetDir, skill);

      try {
        await fs.rm(targetPath, { recursive: true, force: true });
        const relPath = path.relative(path.dirname(targetPath), sourcePath);
        await fs.symlink(relPath, targetPath);
        log.step(`Linked: ${color.green(skill)} -> ${targetDir}/${skill}`);
      } catch (err) {
        log.error(`Failed to link ${skill} to ${targetDir}: ${err}`);
      }
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      clean: { type: 'boolean' },
      'no-clean': { type: 'boolean' },
    },
    strict: false,
  });

  intro(color.cyan('uskills - Skill Linking Tool'));

  const { config, configFile } = await loadConfig<Config>({
    name: 'uskills',
    defaults: DEFAULT_CONFIG,
  });

  const isConfigFound = configFile && path.isAbsolute(configFile);

  if (!isConfigFound) {
    log.info(color.dim('No configuration file found, using defaults.'));
  } else {
    log.info(
      `${color.dim('Config loaded from')} ${color.blue(path.relative(process.cwd(), configFile))}`
    );
  }

  const CONFIG = config!;
  const isCleanEnabled = (values.clean as boolean | undefined) ?? (values['no-clean'] ? false : CONFIG.clean);

  log.info(
    `${color.dim('Target cleaning:')} ${isCleanEnabled ? color.yellow('enabled') : color.dim('disabled')
    }`
  );

  const rootDir = process.cwd();
  const skillsDir = path.join(rootDir, CONFIG.sourceSkillsDir);

  const options = getSkillOptions(skillsDir);

  if (options.length === 0) {
    log.warn(`No folders found in ${CONFIG.sourceSkillsDir}`);
    outro('Exiting...');
    return;
  }

  const selectedSkills = await multiselect({
    message: `Select skills to link to ${color.bold(CONFIG.targetDirs.join(' and '))}`,
    options: options,
    required: true,
  });

  if (isCancel(selectedSkills)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const s = spinner();
  s.start('Linking skills...');

  await prepareTargets(CONFIG, rootDir, isCleanEnabled);
  await linkSelectedSkills(selectedSkills as string[], CONFIG, rootDir, skillsDir);

  s.stop('Skills linked successfully!');
  outro(color.cyan('All set!'));
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    log.error(color.red(String(err)));
    process.exit(1);
  });
}



