<script setup>
// Package imports
import { reactive, ref } from 'vue'

// Constants
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
const editedIndex = ref(-1)

const editDialog = ref(false)
const deleteDialog = ref(false)

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

// Functions
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

const submitForm = () => {
    items.push({
        apptid: generateRandomID(),
        pxid: generateRandomID(),
        clinicid: generateRandomID(),
        doctorid: generateRandomID(),
        status: formFields.status,
        TimeQueued: formFields.TimeQueued,
        QueueDate: formFields.QueueDate,
        StartTime: formFields.StartTime,
        EndTime: formFields.EndTime,
        type: formFields.type,
        isVirtual: formFields.isVirtual,
        City: formFields.City,
        Province: formFields.Province,
        RegionName: formFields.RegionName
    })

    // TODO: Add API call here

    resetFormFields()
}

const editItem = (item) => {
    editedIndex.value = items.indexOf(item)
    Object.assign(formFields, item)
    editDialog.value = true
}

const deleteItem = (item) => {
    editedIndex.value = items.indexOf(item)
    deleteDialog.value = true
}

const saveEdit = () => {
    Object.assign(items[editedIndex.value], formFields)
    editDialog.value = false

    // TODO: Add API call here

    editedIndex.value = -1
    resetFormFields()
}

const deleteItemConfirm = () => {
    items.splice(editedIndex.value, 1)
    deleteDialog.value = false

    // TODO: Add API call here

    editedIndex.value = -1
    resetFormFields()
}
</script>

<template>
    <div id="content">
        <v-dialog>
            <template #activator="{ props: activatorProps }">
                <v-btn
                    class="mb-5"
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
                    <v-card-title>
                        <span class="headline">Create Appointment</span>
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
                    <v-btn color="blue darken-1" text="" @click="saveEdit"> Save </v-btn>
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
                    <v-btn color="blue darken-1" text="" @click="deleteItemConfirm"> Delete </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-data-table
            :headers="headers"
            :items="items"
            class="bg-light-blue-darken-4 rounded-xl px-4 pb-3"
        >
            <template #item.actions="{ item }">
                <v-icon class="me-2" size="small" @click="editItem(item)"> mdi-pencil </v-icon>
                <v-icon size="small" @click="deleteItem(item)"> mdi-delete </v-icon>
            </template>
        </v-data-table>
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
</style>
