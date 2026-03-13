import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import { existsSync, readdirSync, lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getSkillOptions, prepareTargets, linkSelectedSkills } from '../src/cli';

// Mock Node.js fs modules
vi.mock('node:fs', () => ({
	existsSync: vi.fn(),
	readdirSync: vi.fn(),
	lstatSync: vi.fn(),
	readFileSync: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
	default: {
		rm: vi.fn(),
		mkdir: vi.fn(),
		symlink: vi.fn(),
	},
}));

// Mock color and log to avoid cluttering test output
vi.mock('picocolors', () => ({
	default: {
		cyan: (s: string) => s,
		red: (s: string) => s,
		green: (s: string) => s,
		bold: (s: string) => s,
	},
}));

vi.mock('@clack/prompts', () => ({
	log: {
		step: vi.fn(),
		error: vi.fn(),
	},
}));

describe('uskills cli logic', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getSkillOptions', () => {
		it('returns empty array if skills directory does not exist', () => {
			vi.mocked(existsSync).mockReturnValue(false);
			const options = getSkillOptions('.uskills');
			expect(options).toEqual([]);
		});

		it('scans folders and reads SKILL.md', () => {
			vi.mocked(existsSync).mockReturnValue(true);
			vi.mocked(readdirSync).mockReturnValue(['skill-1' as any]);
			vi.mocked(lstatSync).mockReturnValue({ isDirectory: () => true } as any);
			vi.mocked(readFileSync).mockReturnValue('---\nname: Test Skill\ndescription: Test Desc\n---\nContent');

			const options = getSkillOptions('.uskills');

			expect(options).toHaveLength(1);
			expect(options[0]).toEqual({
				label: 'Test Skill',
				value: 'skill-1',
				hint: 'Test Desc',
			});
		});
	});

	describe('prepareTargets', () => {
		it('cleans and creates directories', async () => {
			const config = {
				sourceSkillsDir: '.uskills',
				targetDirs: ['dist/a', 'dist/b'],
				clean: true,
			};

			await prepareTargets(config, '/root', true);

			expect(fs.rm).toHaveBeenCalledTimes(2);
			expect(fs.mkdir).toHaveBeenCalledTimes(2);
			expect(fs.mkdir).toHaveBeenCalledWith(path.join('/root', 'dist/a'), { recursive: true });
		});

		it('does not clean if disabled', async () => {
			const config = {
				sourceSkillsDir: '.uskills',
				targetDirs: ['dist/a'],
				clean: false,
			};

			await prepareTargets(config, '/root', false);

			expect(fs.rm).not.toHaveBeenCalled();
			expect(fs.mkdir).toHaveBeenCalled();
		});
	});

	describe('linkSelectedSkills', () => {
		it('creates symlinks for selected skills', async () => {
			const config = {
				sourceSkillsDir: '.uskills',
				targetDirs: ['.agent/skills'],
				clean: true,
			};
			const selected = ['skill-a'];

			await linkSelectedSkills(selected, config, '/root', '/root/.uskills');

			expect(fs.rm).toHaveBeenCalled();
			expect(fs.symlink).toHaveBeenCalledWith(
				expect.stringContaining('skill-a'),
				expect.stringContaining('.agent/skills/skill-a')
			);
		});
	});
});
