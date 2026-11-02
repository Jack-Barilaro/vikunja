import type {ProjectResponse} from '@/client/queries/projects'
import type {SidebarProjectSortMode} from '@/helpers/userSettings'

const titleCollator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'})

function compareByTitle(a: ProjectResponse, b: ProjectResponse): number {
	return titleCollator.compare(a.title, b.title) || a.id - b.id
}

function normalizedColor(project: ProjectResponse): string {
	return project.hex_color.trim().replace(/^#/, '').toLowerCase()
}

export function sortSidebarProjects(
	projects: readonly ProjectResponse[],
	mode: SidebarProjectSortMode,
): ProjectResponse[] {
	const sorted = [...projects]
	switch (mode) {
		case 'title-asc':
			return sorted.sort(compareByTitle)
		case 'title-desc':
			return sorted.sort((a, b) => titleCollator.compare(b.title, a.title) || a.id - b.id)
		case 'color':
			return sorted.sort((a, b) => {
				const colorA = normalizedColor(a)
				const colorB = normalizedColor(b)
				if (colorA === '' || colorB === '') {
					if (colorA === colorB) return compareByTitle(a, b)
					return colorA === '' ? 1 : -1
				}
				return (colorA < colorB ? -1 : colorA > colorB ? 1 : 0) || compareByTitle(a, b)
			})
		case 'manual':
		default:
			return sorted
	}
}
