<script setup>
// Package imports
import { onMounted, reactive, ref } from 'vue'

// Constants
import { API_URL } from '@/constants/api_url.js'

const intervals = new Set()

const headers = [
    { title: 'Appointment ID', value: 'apptid' },
    // { title: 'Patient ID', value: 'pxid' },
    // { title: 'Clinic ID', value: 'clinicid' },
    // { title: 'Doctor ID', value: 'doctorid' },
    { title: 'Status', value: 'status' },
    {
        title: 'Time Queued',
        key: 'TimeQueued',
        value: (item) => new Date(item.TimeQueued).toLocaleString()
    },
    {
        title: 'Queued Date',
        key: 'QueueDate',
        value: (item) => new Date(item.QueueDate).toLocaleString()
    },
    {
        title: 'Start Time',
        key: 'StartTime',
        value: (item) => new Date(item.StartTime).toLocaleString()
    },
    { title: 'End Time', key: 'EndTime', value: (item) => new Date(item.EndTime).toLocaleString() },
    { title: 'Type', value: 'type' },
    { title: 'Virtual?', key: 'isVirtual', value: (item) => (item.isVirtual ? 'Yes' : 'No') },
    // { title: 'City', value: 'City' },
    // { title: 'Province', value: 'Province' },
    { title: 'Region', value: 'RegionName' },
    { title: 'Actions', key: 'actions', sortable: false }
]

// Refs
const loading = ref(false)
const itemsPerPage = ref(10)
const totalItems = ref(100)

const editedIndex = ref(-1)
const editDialog = ref(false)
const deleteDialog = ref(false)

const node1Available = ref(false)
const node2Available = ref(false)
const node3Available = ref(false)

const nodeUsed = ref(0)

const formFields = reactive({
    status: '',
    TimeQueued: '',
    QueueDate: '',
    StartTime: '',
    EndTime: '',
    type: '',
    isVirtual: false,
    City: 'Manila', // TODO: Do not bother with this for now
    Province: 'Metro Manila', // TODO: Do not bother with this for now
    RegionName: ''
})

const items = reactive([])

// --- Functions ---
// Utils
const generateRandomID = () => {
    let id = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    for (let i = 0; i < 32; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    return id
}

const resetFormFields = () => {
    formFields.status = ''
    formFields.TimeQueued = ''
    formFields.QueueDate = ''
    formFields.StartTime = ''
    formFields.EndTime = ''
    formFields.type = ''
    formFields.isVirtual = false
    formFields.RegionName = ''
}

// Main
const retrieveTotalItems = async () => {
    const { size } = await fetch(`${API_URL}/appointments/size`).then((res) => res.json())

    totalItems.value = size
}

const retrieveNodeStatus = async () => {
    try {
        const result = await fetch(`${API_URL}/status`).then((res) => res.json())

        node1Available.value = result.node1
        node2Available.value = result.node2
        node3Available.value = result.node3

        // If the node being used is not available, reset it to 0
        if (nodeUsed.value !== 0 && !result[`node${nodeUsed.value}`]) nodeUsed.value = 0
    } catch (e) {
        console.error(e)
        node1Available.value = false
        node2Available.value = false
        node3Available.value = false
    }
}

const fetchPage = async ({ page = 1 } = {}) => {
    loading.value = true

    await retrieveTotalItems()

    const params = new URLSearchParams()
    params.set('page', page - 1)
    params.set('itemsPerPage', itemsPerPage.value)
    if (nodeUsed.value !== 0) params.set('node', nodeUsed.value)
    const appointments = await fetch(`${API_URL}/appointments?${params}`).then((res) => res.json())

    items.splice(0, items.length, ...appointments)

    loading.value = false
}

const submitForm = async () => {
    const data = {
        ...formFields,
        pxid: generateRandomID(),
        clinicid: generateRandomID(),
        doctorid: generateRandomID()
    }

    const body = { data }

    if (nodeUsed.value !== 0) body.node = nodeUsed.value

    const newID = await fetch(`${API_URL}/appointments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
        .then((res) => res.json())
        .then((data) => data.apptid)

    items.push({ ...data, apptid: newID })

    resetFormFields()
    totalItems.value++
}

const editItem = (item) => {
    if (!node1Available.value) return

    editedIndex.value = items.indexOf(item)

    const itemCopy = JSON.parse(JSON.stringify(item))

    // Convert TimeQueued, QueueDate, StartTime, and EndTime to the format 'YYYY-MM-DDTHH:MM'
    itemCopy.TimeQueued = new Date(itemCopy.TimeQueued).toISOString().slice(0, 16)
    itemCopy.QueueDate = new Date(itemCopy.QueueDate).toISOString().slice(0, 16)
    itemCopy.StartTime = new Date(itemCopy.StartTime).toISOString().slice(0, 16)
    itemCopy.EndTime = new Date(itemCopy.EndTime).toISOString().slice(0, 16)

    Object.assign(formFields, itemCopy)
    editDialog.value = true
}

const deleteItem = (item) => {
    if (!node1Available.value) return

    editedIndex.value = items.indexOf(item)
    deleteDialog.value = true
}

const saveEdit = async () => {
    Object.assign(items[editedIndex.value], formFields)
    editDialog.value = false

    const body = { data: formFields }

    if (nodeUsed.value !== 0) body.node = nodeUsed.value

    const idToEdit = items[editedIndex.value].apptid
    await fetch(`${API_URL}/appointments/${idToEdit}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    editedIndex.value = -1
    resetFormFields()
}

const deleteItemConfirm = async () => {
    items.splice(editedIndex.value, 1)
    deleteDialog.value = false

    const options = {}

    if (nodeUsed.value !== 0) {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify({ node: nodeUsed.value })
    }

    const idToDelete = items[editedIndex.value].apptid
    await fetch(`${API_URL}/appointments/${idToDelete}`, {
        method: 'DELETE',
        ...options
    })

    editedIndex.value = -1
    resetFormFields()
    totalItems.value--
}

// Lifecycle hooks
onMounted(() => {
    retrieveTotalItems()
    retrieveNodeStatus()
    intervals.add(setInterval(retrieveNodeStatus, 10_000)) // Check every 10 seconds
})
</script>

<template>
    <div id="content">
        <div id="node-status">
            <div class="node mx-2">
                <v-icon :color="node1Available ? 'success' : 'error'" size="x-large">
                    {{ node1Available ? 'mdi-server' : 'mdi-server-off' }}
                </v-icon>
                <v-chip
                    :color="node1Available ? 'success' : 'error'"
                    @click="nodeUsed = node1Available ? 1 : nodeUsed"
                >
                    <v-icon>{{ node1Available ? 'mdi-check' : 'mdi-close' }}</v-icon>
                    <span>Node 1</span>
                </v-chip>
            </div>
            <div class="node mx-2">
                <v-icon :color="node2Available ? 'success' : 'error'" size="x-large">
                    {{ node2Available ? 'mdi-server' : 'mdi-server-off' }}
                </v-icon>
                <v-chip
                    :color="node2Available ? 'success' : 'error'"
                    @click="nodeUsed = node2Available ? 2 : nodeUsed"
                >
                    <v-icon>{{ node2Available ? 'mdi-check' : 'mdi-close' }}</v-icon>
                    <span>Node 2</span>
                </v-chip>
            </div>
            <div class="node mx-2">
                <v-icon :color="node3Available ? 'success' : 'error'" size="x-large">
                    {{ node3Available ? 'mdi-server' : 'mdi-server-off' }}
                </v-icon>
                <v-chip
                    :color="node3Available ? 'success' : 'error'"
                    @click="nodeUsed = node3Available ? 3 : nodeUsed"
                >
                    <v-icon>{{ node3Available ? 'mdi-check' : 'mdi-close' }}</v-icon>
                    <span>Node 3</span>
                </v-chip>
            </div>
        </div>

        <v-chip class="mt-5" @click="nodeUsed = 0">
            <span>
                You are using {{ nodeUsed === 0 ? 'any node' : `Node ${nodeUsed} only` }}.
                {{ nodeUsed === 0 ? '' : ' Click to use any node.' }}
            </span>
        </v-chip>

        <v-dialog>
            <template #activator="{ props: activatorProps }">
                <v-btn
                    :disabled="!node1Available && !node2Available && !node3Available"
                    class="my-5"
                    color="primary"
                    dark
                    v-bind="activatorProps"
                    @click="
                        () => {
                            resetFormFields()
                            formFields.TimeQueued = new Date().toISOString().slice(0, 16)
                        }
                    "
                >
                    Create Appointment
                </v-btn>
            </template>
            <template #default="{ isActive }">
                <v-card class="bg-blue-grey-darken-4 w-75 align-self-center">
                    <v-card-text>
                        <v-form>
                            <v-switch v-model="formFields.isVirtual" label="Virtual?" />
                            <v-select
                                v-model="formFields.status"
                                :items="['Queued', 'Completed']"
                                label="Status"
                            />
                            <v-text-field
                                v-model="formFields.TimeQueued"
                                disabled="disabled"
                                label="Time Queued"
                                type="datetime-local"
                            />
                            <v-text-field
                                v-model="formFields.QueueDate"
                                label="Queued Date"
                                type="datetime-local"
                            />
                            <v-text-field
                                v-model="formFields.StartTime"
                                label="Start Time"
                                type="datetime-local"
                            />
                            <v-text-field
                                v-model="formFields.EndTime"
                                label="End Time"
                                type="datetime-local"
                            />
                            <v-select
                                v-model="formFields.type"
                                :items="['Consultation', 'Inpatient']"
                                label="Type"
                            />
                            <v-select
                                v-model="formFields.RegionName"
                                :items="['National Capital Region (NCR)', 'Central Visayas (VII)']"
                                label="Region"
                            />
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn color="blue darken-1" text="" @click="isActive.value = false">
                            Cancel
                        </v-btn>
                        <v-btn
                            color="blue darken-1"
                            text=""
                            @click="
                                () => {
                                    isActive.value = false
                                    submitForm()
                                }
                            "
                        >
                            Submit
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </template>
        </v-dialog>

        <v-dialog v-model="editDialog">
            <v-card class="bg-blue-grey-darken-4">
                <v-card-title>
                    <span class="headline">Edit Appointment</span>
                </v-card-title>
                <v-card-text>
                    <v-form>
                        <v-switch v-model="formFields.isVirtual" label="Virtual?" />
                        <v-select
                            v-model="formFields.status"
                            :items="['Queued', 'Completed']"
                            label="Status"
                        />
                        <v-text-field
                            v-model="formFields.TimeQueued"
                            disabled="disabled"
                            label="Time Queued"
                            type="datetime-local"
                        />
                        <v-text-field
                            v-model="formFields.QueueDate"
                            label="Queued Date"
                            type="datetime-local"
                        />
                        <v-text-field
                            v-model="formFields.StartTime"
                            label="Start Time"
                            type="datetime-local"
                        />
                        <v-text-field
                            v-model="formFields.EndTime"
                            label="End Time"
                            type="datetime-local"
                        />
                        <v-select
                            v-model="formFields.type"
                            :items="['Consultation', 'Inpatient']"
                            label="Type"
                        />
                        <v-select
                            v-model="formFields.RegionName"
                            :items="['National Capital Region (NCR)', 'Central Visayas (VII)']"
                            label="Region"
                        />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="blue darken-1" text="" @click="editDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="blue darken-1" text="" @click="saveEdit">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="deleteDialog">
            <v-card class="bg-blue-grey-darken-4 w-50 align-self-center">
                <v-card-title>
                    <span class="headline">Delete Appointment</span>
                </v-card-title>
                <v-card-text>
                    <p>Are you sure you want to delete this appointment?</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="blue darken-1" text="" @click="deleteDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="blue darken-1" text="" @click="deleteItemConfirm">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="items"
            :items-length="totalItems"
            :items-per-page-options="[5, 10, 20, 50, 100]"
            :loading="loading"
            class="bg-light-blue-darken-4 rounded-xl px-4 pb-3"
            loading-text="Loading..."
            no-data-text="No appointments found"
            @update:options="fetchPage"
        >
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.actions="{ item }">
                <v-icon class="me-2" size="small" @click="editItem(item)">
                    {{
                        node1Available || node2Available || node3Available
                            ? 'mdi-pencil'
                            : 'mdi-pencil-off'
                    }}
                </v-icon>
                <v-icon size="small" @click="deleteItem(item)">
                    {{
                        node1Available || node2Available || node3Available
                            ? 'mdi-delete'
                            : 'mdi-delete-off'
                    }}
                </v-icon>
            </template>
        </v-data-table-server>
    </div>
</template>

<style scoped>
#content {
    height: 100vh;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: flex-start;
}

#node-status {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-around;
}

.node {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    gap: 10px;
}
</style>
