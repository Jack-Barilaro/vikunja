import {describe, expect, it} from 'vitest'

import type {ProjectResponse} from '@/client/queries/projects'
import {sortSidebarProjects} from './sortSidebarProjects'

function project(id: number, title: string, position: number, hex_color = ''): ProjectResponse {
	return {id, title, position, hex_color} as ProjectResponse
}

describe('sortSidebarProjects', () => {
	it('sorts titles naturally without case sensitivity and uses the id for ties', () => {
		const projects = [
			project(4, 'Task 10', 0),
			project(2, 'apple', 1),
			project(3, 'Task 2', 2),
			project(1, 'APPLE', 3),
		]

		expect(sortSidebarProjects(projects, 'title-asc').map(p => p.id)).toEqual([1, 2, 3, 4])
		expect(sortSidebarProjects(projects, 'title-desc').map(p => p.id)).toEqual([4, 3, 1, 2])
	})

	it('groups normalized colors deterministically, sorts within groups, and puts missing colors last', () => {
		const projects = [
			project(1, 'Uncolored Z', 0),
			project(2, 'Red Z', 1, '#FF0000'),
			project(3, 'Green', 2, '00ff00'),
			project(4, 'Red A', 3, 'ff0000'),
			project(5, 'Blue', 4, '#0000FF'),
			project(6, 'Uncolored A', 5),
		]

		expect(sortSidebarProjects(projects, 'color').map(p => p.id)).toEqual([5, 3, 4, 2, 6, 1])
	})

	it('returns a sorted copy and preserves saved manual order across automatic modes', () => {
		const projects = [
			project(1, 'Zebra', 1),
			project(2, 'Alpha', 2),
			project(3, 'Middle', 3),
		]

		expect(sortSidebarProjects(projects, 'title-asc').map(p => p.id)).toEqual([2, 3, 1])
		expect(sortSidebarProjects(projects, 'manual').map(p => p.id)).toEqual([1, 2, 3])
		expect(projects.map(p => p.id)).toEqual([1, 2, 3])
	})

	it('sorts each sibling list independently for nested projects', () => {
		const roots = [project(1, 'Zebra', 1), project(2, 'Alpha', 2)]
		const children = [project(3, 'Child Z', 1), project(4, 'Child A', 2)]

		expect(sortSidebarProjects(roots, 'title-asc').map(p => p.id)).toEqual([2, 1])
		expect(sortSidebarProjects(children, 'title-asc').map(p => p.id)).toEqual([4, 3])
	})
})
