const constants = require('./constants')

module.exports = {
	initActions() {
		let actions = {}

		let model = this.MODELS.find((model) => model.id == this.config.model)

		if (model) {
			if (model.actions.includes('schmute')) {
				actions['schmute'] = {
					name: 'Channel Mute',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
						{
							type: 'dropdown',
							label: 'Mute',
							id: 'mute',
							default: '1',
							choices: [
								{ id: '1', label: 'On' },
								{ id: '0', label: 'Off' },
							],
						},
					],
					callback: async (event) => {
						let opt = event.options
						let params = ''

						params += opt.channel
						params += ',' //separator
						params += opt.mute

						this.sendCommand('schmute', 'S', params)
					},
				}
			}

			if (model.actions.includes('schvolume')) {
				actions['schvolume'] = {
					name: 'Channel Volume',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
						{
							type: 'dropdown',
							label: 'Volume',
							id: 'volume',
							default: constants.volumeLevels[0].id,
							choices: constants.volumeLevels,
						},
					],
					callback: async (event) => {
						let opt = event.options
						let params = ''

						params += opt.channel
						params += ',' //separator
						params += opt.volume

						this.sendCommand('schvolume', 'S', params)
					},
				}
			}

			if (model.actions.includes('schhpf')) {
				actions['schhpf'] = {
					name: 'Channel High Pass Filter',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
						{
							type: 'dropdown',
							label: 'High Pass Filter',
							id: 'hpf',
							default: constants.hpfChoices[0].id,
							choices: constants.hpfChoices,
						},
					],
					callback: async (event) => {
						let opt = event.options
						let params = ''

						params += opt.channel
						params += ',' //separator
						params += opt.hpf

						this.sendCommand('schhpf', 'S', params)
					},
				}
			}

			if (model.actions.includes('rpresetcall')) {
				actions['rpresetcall'] = {
					name: 'Recall Preset',
					options: [
						{
							type: 'dropdown',
							label: 'Preset Number',
							id: 'preset',
							default: 1,
							choices: [
								{ id: 1, label: 'Preset 1' },
								{ id: 2, label: 'Preset 2' },
								{ id: 3, label: 'Preset 3' },
								{ id: 4, label: 'Preset 4' },
								{ id: 5, label: 'Preset 5' },
								{ id: 6, label: 'Preset 6' },
								{ id: 7, label: 'Preset 7' },
								{ id: 8, label: 'Preset 8' },
							],
						},
					],
					callback: async (event) => {
						let params = ''

						params += event.options.preset

						this.sendCommand('rpresetcall', 'S', params)
					},
				}
			}

			if (model.actions.includes('stxmicgain')) {
				actions['stxmicgain'] = {
					name: 'TX Gain',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
						{
							type: 'dropdown',
							label: 'Gain',
							id: 'gain',
							default: constants.micGainChoices[0].id,
							choices: constants.micGainChoices,
						},
					],
					callback: async (event) => {
						let params = ''

						params += event.options.channel
						params += ',' //separator
						params += event.options.gain

						this.sendCommand('stxmicgain', 'S', params)
					},
				}
			}

			if (model.actions.includes('stxintmicgain')) {
				actions['stxintmicgain'] = {
					name: 'TX Internal Mic Gain',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
						{
							type: 'dropdown',
							label: 'Gain',
							id: 'gain',
							default: constants.micGainChoices[0].id,
							choices: constants.micGainChoices,
						},
					],
					callback: async (event) => {
						let params = ''

						params += event.options.channel
						params += ',' //separator
						params += event.options.gain

						this.sendCommand('stxintmicgain', 'S', params)
					},
				}
			}

			if (model.actions.includes('stxmicpolar')) {
				actions['stxmicpolar'] = {
					name: 'TX Microphone Directivity',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
						{
							type: 'dropdown',
							label: 'Directivity',
							id: 'polar',
							default: constants.polarityChoices[0].id,
							choices: constants.polarityChoices,
						},
					],
					callback: async (event) => {
						let params = ''

						params += event.options.channel
						params += ',' //separator
						params += event.options.polar

						this.sendCommand('stxmicpolar', 'S', params)
					},
				}
			}

			if (model.actions.includes('stxforcedmute')) {
				actions['stxforcedmute'] = {
					name: 'TX External Mute',
					options: [
						{
							type: 'dropdown',
							label: 'CH Number in which RU and TX are linked',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
						{
							type: 'dropdown',
							label: 'Forced Mute Setting',
							id: 'forcedmute',
							default: constants.forcedMuteChoices[0].id,
							choices: constants.forcedMuteChoices,
						},
					],
					callback: async (event) => {
						let params = ''

						params += event.options.channel
						params += ',' //separator
						params += event.options.forcedmute

						this.sendCommand('stxforcedmute', 'S', params)
					},
				}
			}

			if (model.actions.includes('salltxforcedmute')) {
				actions['salltxforcedmute'] = {
					name: 'TX External Mute Collective',
					options: [
						{
							type: 'dropdown',
							label: 'Mute',
							id: 'mute',
							default: constants.forcedMuteChoices[0].id,
							choices: constants.forcedMuteChoices,
						},
					],
					callback: async (event) => {
						let params = ''

						params += event.options.mute

						this.sendCommand('salltxforcedmute', 'S', params)
					},
				}
			}
		}

		this.setActionDefinitions(actions)
	},
}
