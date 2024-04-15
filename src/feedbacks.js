const { combineRgb } = require('@companion-module/base')

const constants = require('./constants')

module.exports = {
	initFeedbacks() {
		let self = this

		let feedbacks = {}

		let model = this.MODELS.find((model) => model.id == this.config.model)

		if (model) {
			//push model specific feedbacks
			if (model.feedbacks.includes('gchmute')) {
				feedbacks['gchmute'] = {
					type: 'boolean',
					name: 'Channel is Muted',
					description: 'Indicates if the channel is muted',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							id: 'channel',
							default: model.channels[0].id,
							choices: model.channels,
						},
					],
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0),
					},
					callback: (event) => {
						let opt = event.options

						//get the channel from the options
						let channelNumber = opt.channel

						//get the channelObj
						let channelObj = self.DATA.channels.find((channel) => channel.id == channelNumber)

						//check if the channel is muted
						if (channelObj && channelObj.mute == true) {
							return true
						}

						return false
					},
				}
			}

			if (model.feedbacks.includes('gchhpf')) {
				feedbacks['gchhpf'] = {
					type: 'boolean',
					name: 'Channel High Pass Filter is X',
					description: 'Indicates if the channel high pass filter is the selected choice',
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
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0),
					},
					callback: (event) => {
						let opt = event.options

						//get the channel from the options
						let channelNumber = opt.channel

						let hpfChoice = opt.hpf

						//get the channelObj
						let channelObj = self.DATA.channels.find((channel) => channel.id == channelNumber)

						//check if the channel high pass filter is on
						if (channelObj && channelObj.hpf == hpfChoice) {
							return true
						}

						return false
					},
				}
			}

			if (model.feedbacks.includes('rlastpreset')) {
				feedbacks['rlastpreset'] = {
					type: 'boolean',
					name: 'Last Preset Recalled is X',
					description: 'Indicates if the last preset recalled is X',
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
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0),
					},
					callback: (event) => {
						let opt = event.options

						let presetNumber = opt.preset

						if (
							self.DATA &&
							self.DATA.lastPresetRecalled &&
							self.DATA.lastPresetRecalled.toString() == presetNumber.toString()
						) {
							return true
						}

						return false
					},
				}
			}

			if (model.feedbacks.includes('gtxmicpolar')) {
				feedbacks['gtxmicpolar'] = {
					type: 'boolean',
					name: 'TX Microphone Directivity is X',
					description: 'Indicates if the TX Microphone Directivity is X',
					options: [
						{
							type: 'dropdown',
							label: 'Charger Port Where TX is Installed',
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
					defaultStyle: {
						color: combineRgb(0, 0, 0),
						bgcolor: combineRgb(255, 0, 0),
					},
					callback: (event) => {
						let opt = event.options

						//get the channel from the options
						let channelNumber = opt.channel

						let polarChoice = opt.polar

						//get the channelObj
						let channelObj = self.DATA.channels.find((channel) => channel.id == channelNumber)

						//check if the channel polarity matches the choice
						if (channelObj && channelObj.micPolar == polarChoice) {
							return true
						}

						return false
					},
				}
			}
		}

		this.setFeedbackDefinitions(feedbacks)
	},
}
