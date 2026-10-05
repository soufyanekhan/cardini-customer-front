import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

/**
 * Group: { id, name, members_count, members?: [{ id, name, nin, phone }] }
 */
export const useGroupsStore = defineStore('groups', () => {
  const groups = ref([])
  const loaded = ref(false)

  async function fetchGroups() {
    const { data } = await api.get('/customer/groups')
    groups.value = data.groups
    loaded.value = true
  }

  async function createGroup(name) {
    const { data } = await api.post('/customer/groups', { name })
    groups.value.unshift(data.group)
    return data.group
  }

  async function deleteGroup(id) {
    await api.delete(`/customer/groups/${id}`)
    groups.value = groups.value.filter((g) => g.id !== id)
  }

  /** Returns the group with its members. */
  async function fetchGroup(id) {
    const { data } = await api.get(`/customer/groups/${id}`)
    return data.group
  }

  async function renameGroup(id, name) {
    const { data } = await api.put(`/customer/groups/${id}`, { name })
    return data.group
  }

  /** @param {string} nin National number of an existing customer. */
  async function addMember(groupId, nin) {
    const { data } = await api.post(`/customer/groups/${groupId}/members`, { nin })
    return data.group
  }

  async function removeMember(groupId, personId) {
    const { data } = await api.delete(`/customer/groups/${groupId}/members/${personId}`)
    return data.group
  }

  return {
    groups,
    loaded,
    fetchGroups,
    createGroup,
    deleteGroup,
    fetchGroup,
    renameGroup,
    addMember,
    removeMember,
  }
})
