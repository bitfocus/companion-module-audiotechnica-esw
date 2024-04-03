// Audio Technica ESW

const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

const utils = require('./src/utils')

const models = require('./src/models')
const constants = require('./src/constants')

class ateswInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils,
			...models,
			...constants,
		})

		this.socket = undefined

		this.cmdPipe = []
		this.lastReturnedCommand = undefined

		this.pollTimer = undefined

		this.CONTROL_MODELID = '0000'
		this.CONTROL_UNITNUMBER = '00'
		this.CONTROL_CONTINUESELECT = 'NC'
		this.CONTROL_ACK = 'ACK'
		this.CONTROL_NAK = 'NAK'
		this.CONTROL_END = '\r'

		this.DATA = {
			channels: [],
			presetNames: [],
			roamingPresetNames: [],
		}
	}

	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}

		//debug('destroy', this.id)
	}

	async init(config) {
		this.updateStatus(InstanceStatus.Connecting)
		this.configUpdated(config)
	}

	async configUpdated(config) {
		// polling is running and polling has been de-selected by config change
		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}
		this.config = config

		this.setUpInternalDataArrays()

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.initTCP()
	}
}

runEntrypoint(ateswInstance, UpgradeScripts)
