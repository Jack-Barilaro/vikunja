import {describe, it, expect, vi} from 'vitest'
import {mount} from '@vue/test-utils'
import {defineComponent, h, nextTick, type PropType} from 'vue'
import draggable from 'zhyswan-vuedraggable'
import type {SortableEvent} from 'sortablejs'

import ProjectsNavigation from './ProjectsNavigation.vue'
import type {ProjectResponse} from '@/client/queries/projects'

const updateProject = vi.hoisted(() => vi.fn())
vi.mock('@/client/queries/projects', () => ({
	useUpdateProjectMutation: () => ({mutateAsync: updateProject}),
}))
vi.mock('@/composables/useProjects', () => ({
	useProjects: () => ({projects: {}}),
}))

const ProjectsNavigationItem = defineComponent({
	props: {
		project: {type: Object as PropType<ProjectResponse>, required: true},
		canEditOrder: {type: Boolean, default: false},
	},
	setup: props => () => h('li', {
		'data-project-id': props.project.id,
		'data-can-edit-order': props.canEditOrder,
	}),
})

function projects(...ids: number[]) {
	return ids.map(id => ({id, position: id}) as ProjectResponse)
}

function renderedIds(wrapper: ReturnType<typeof mount>) {
	return wrapper.findAll('li').map(li => Number(li.attributes('data-project-id')))
}

describe('ProjectsNavigation', () => {
	it('sorts an automatic view without changing manual order and disables dragging', async () => {
		const input = [
			{...projects(1)[0], title: 'Zebra'},
			{...projects(2)[0], title: 'Alpha'},
		]
		const wrapper = mount(ProjectsNavigation, {
			props: {modelValue: input, canEditOrder: true, sortMode: 'title-asc'},
			global: {stubs: {ProjectsNavigationItem}},
		})
		const list = wrapper.findComponent(draggable)

		expect(renderedIds(wrapper)).toEqual([2, 1])
		expect(list.find('menu').classes()).toContain('dragging-disabled')
		expect(wrapper.findAll('li').every(item => item.attributes('data-can-edit-order') === 'false')).toBe(true)
		list.vm.$emit('end', {} as SortableEvent)
		expect(updateProject).not.toHaveBeenCalled()

		await wrapper.setProps({sortMode: 'manual'})

		expect(renderedIds(wrapper)).toEqual([1, 2])
		expect(input.map(project => project.id)).toEqual([1, 2])
		wrapper.unmount()
	})

	it('does not patch the list while Sortable owns its DOM', async () => {
		const errors: unknown[] = []
		const wrapper = mount(ProjectsNavigation, {
			props: {modelValue: projects(1, 2, 3, 4), canEditOrder: true},
			attachTo: document.body,
			global: {
				stubs: {ProjectsNavigationItem},
				config: {errorHandler: error => { errors.push(error) }},
			},
		})
		const list = wrapper.findComponent(draggable)

		list.vm.$emit('start')
		await nextTick()

		// Sortable moves the dragged node while it hovers over another list.
		const dragged = wrapper.find('li[data-project-id="2"]').element
		const originalParent = dragged.parentElement!
		const otherList = document.createElement('menu')
		document.body.appendChild(otherList)
		otherList.appendChild(dragged)

		// A refetch landing mid-drag moves 4 in front of the dragged node.
		await wrapper.setProps({modelValue: projects(1, 4, 2, 3)})

		expect(errors).toEqual([])

		// vuedraggable puts the node back on drop.
		originalParent.insertBefore(dragged, originalParent.children[1] ?? null)
		list.vm.$emit('end', {})
		await nextTick()
		await nextTick()

		expect(errors).toEqual([])
		expect(renderedIds(wrapper)).toEqual([1, 4, 2, 3])

		wrapper.unmount()
		otherList.remove()
	})
})
