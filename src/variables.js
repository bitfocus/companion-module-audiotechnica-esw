const constants = require('./constants')

module.exports = {
	initVariables() {
		let variables = []

		let model = this.MODELS.find((model) => model.id == this.config.model)

		variables.push({ variableId: 'model', name: 'Model' })

		//push common variables
		variables.push({ variableId: 'device_name', name: 'Device Name' })
		variables.push({ variableId: 'device_id', name: 'Device ID' })
		variables.push({ variableId: 'location_name', name: 'Location Name' })

		for (let i = 1; i <= 8; i++) {
			variables.push({ variableId: `preset${i}_name`, name: `Preset ${i} Name` })
		}

		for (let i = 1; i <= 8; i++) {
			variables.push({ variableId: `preset${i}_roaming_name`, name: `Preset Roaming ${i} Name` })
		}

		if (model.variables.includes('glastpreset')) {
			variables.push({ variableId: `preset_number`, name: `Current Preset Number` })
		}

		if (model && model.channels) {
			//push model specific variables
			if (model.variables.includes('gchname')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_name`,
						name: `${model.channels[i].label} Name`,
					})
				}
			}

			if (model.variables.includes('gchmute')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_mute`,
						name: `${model.channels[i].label} Muted`,
					})
				}
			}

			if (model.variables.includes('gchvolume')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_volume`,
						name: `${model.channels[i].label} Volume`,
					})
				}
			}

			if (model.variables.includes('gchhpf')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_hpf`,
						name: `${model.channels[i].label} High Pass Filter`,
					})
				}
			}

			if (model.variables.includes('gtxmicgain')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_mic_gain`,
						name: `${model.channels[i].label} Mic Gain`,
					})
				}
			}

			if (model.variables.includes('gtxintmicgain')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_int_mic_gain`,
						name: `${model.channels[i].label} Int Mic Gain`,
					})
				}
			}

			if (model.variables.includes('gtxmicpolar')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_mic_polar`,
						name: `${model.channels[i].label} Mic Directivity`,
					})
				}
			}

			if (model.variables.includes('gtxforcedmute')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_forcedmute`,
						name: `${model.channels[i].label} Forced Mute State`,
					})
				}
			}

			if (model.variables.includes('glevelrf')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_rf`,
						name: `${model.channels[i].label} RF Level`,
					})
				}
			}

			if (model.variables.includes('glevelafrx')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_afrx`,
						name: `${model.channels[i].label} AF RX Level`,
					})
				}
			}

			if (model.variables.includes('glevelbatttx')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_batttx_linkstatus`,
						name: `${model.channels[i].label} Battery TX Link Status`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batttx_level`,
						name: `${model.channels[i].label} Battery TX Level`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batttx_life`,
						name: `${model.channels[i].label} Battery TX Life (HH:MM)`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batttx_usb`,
						name: `${model.channels[i].label} Battery TX USB Charging Status`,
					})
				}
			}

			if (model.variables.includes('glevelbatt')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_batt_portstatus`,
						name: `${model.channels[i].label} Battery Port Status`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batt_level`,
						name: `${model.channels[i].label} Battery Level`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batt_cycle`,
						name: `${model.channels[i].label} Battery Cycle`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batt_health`,
						name: `${model.channels[i].label} Battery Health`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batt_timetofull`,
						name: `${model.channels[i].label} Battery Time To Full Charge`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batt_temp`,
						name: `${model.channels[i].label} Battery Temp`,
					})
					variables.push({
						variableId: `${model.channels[i].variableId}_batt_chargestatus`,
						name: `${model.channels[i].label} Battery Charge Status`,
					})
				}
			}

			if (model.variables.includes('gstsmute')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_txmute`,
						name: `${model.channels[i].label} TX Mute State`,
					})
				}
			}

			if (model.variables.includes('gtxname')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_txname`,
						name: `${model.channels[i].label} TX Name`,
					})
				}
			}

			if (model.variables.includes('gtxlocationname')) {
				for (let i = 0; i < model.channels.length; i++) {
					variables.push({
						variableId: `${model.channels[i].variableId}_txlocationname`,
						name: `${model.channels[i].label} TX Location Name`,
					})
				}
			}
		}

		this.setVariableDefinitions(variables)

		this.setVariableValues({
			model: model.label,
		})
	},

	checkVariables() {
		try {
			let variableObj = {}

			//common variables
			variableObj['device_name'] = this.DATA.deviceName
			variableObj['device_id'] = this.DATA.deviceId
			variableObj['location_name'] = this.DATA.locationName

			for (let i = 0; i < 8; i++) {
				variableObj[`preset${i + 1}_name`] = this.DATA.presetNames[i]
			}

			for (let i = 0; i < 8; i++) {
				variableObj[`preset${i + 1}_roaming_name`] = this.DATA.roamingPresetNames[i]
			}

			variableObj['preset_number'] = this.DATA.lastPreset

			let model = this.MODELS.find((model) => model.id == this.config.model)

			if (model) {
				for (let i = 0; i < this.DATA.channels.length; i++) {
					let channelObj = this.DATA.channels[i]
					let modelChannelObj = model.channels.find((CHANNEL) => CHANNEL.id == channelObj.id)

					let volObj = constants.volumeLevels.find((vol) => vol.id == channelObj.volume)
					let hpfObj = constants.hpfChoices.find((hpf) => hpf.id == channelObj.hpf)
					let micGainObj = constants.micGainChoices.find((micGain) => micGain.id == channelObj.txMicGain)
					let intMicGainObj = constants.micGainChoices.find(
						(intMicGain) => intMicGain.id == channelObj.txIntMicGain,
					)
					let micPolarObj = constants.polarityChoices.find((micPolar) => micPolar.id == channelObj.txMicPolar)
					let forcedMuteObj = constants.forcedMuteChoices.find(
						(forcedMute) => forcedMute.id == channelObj.txForcedMute,
					)
					let levelRFObj = constants.levelRFChoices.find((levelRF) => levelRF.id == channelObj.levelRF)
					let levelAFRXObj = constants.levelAFRXChoices.find(
						(levelAFRX) => levelAFRX.id == channelObj.levelAFRX,
					)

					if (modelChannelObj) {
						variableObj[`${modelChannelObj.variableId}_name`] = channelObj.name
						variableObj[`${modelChannelObj.variableId}_mute`] = channelObj.mute ? 'On' : 'Off'
						variableObj[`${modelChannelObj.variableId}_volume`] = channelObj.volumeLabel
						variableObj[`${modelChannelObj.variableId}_hpf`] = channelObj.hpfLabel
						variableObj[`${modelChannelObj.variableId}_mic_gain`] = channelObj.txMicGainLabel
						variableObj[`${modelChannelObj.variableId}_int_mic_gain`] = channelObj.txIntMicGainLabel
						variableObj[`${modelChannelObj.variableId}_mic_polar`] = channelObj.txMicPolarityLabel
						variableObj[`${modelChannelObj.variableId}_forcedmute`] = channelObj.txForcedMuteLabel
						variableObj[`${modelChannelObj.variableId}_rf`] = channelObj.levelRFLabel
						variableObj[`${modelChannelObj.variableId}_afrx`] = channelObj.levelAFRXLabel

						if (channelObj.levelBattTx) {
							variableObj[`${modelChannelObj.variableId}_batttx_linkstatus`] =
								channelObj.levelBattTx?.linkStatus == '0' ? 'No LINK' : 'During LINK'
							variableObj[`${modelChannelObj.variableId}_batttx_level`] =
								channelObj.levelBattTx?.batteryLevel + '%'
							variableObj[`${modelChannelObj.variableId}_batttx_life`] =
								channelObj.levelBattTx?.batteryLife?.substring(0, 2) +
								':' +
								channelObj.levelBattTx?.batteryLife?.substring(2, 4)
							variableObj[`${modelChannelObj.variableId}_batttx_usb`] =
								channelObj.levelBattTx?.usbStatus == '0' ? 'Not Charging' : 'Charging'
						}
						else {
							variableObj[`${modelChannelObj.variableId}_batttx_linkstatus`] = ''
							variableObj[`${modelChannelObj.variableId}_batttx_level`] = ''
							variableObj[`${modelChannelObj.variableId}_batttx_life`] = ''
							variableObj[`${modelChannelObj.variableId}_batttx_usb`] = ''
						}

						if (channelObj.levelBatt) {
							variableObj[`${modelChannelObj.variableId}_batt_portstatus`] =
								channelObj.levelBatt?.portStatus == '0' ? 'Not Set' : 'Set'
							variableObj[`${modelChannelObj.variableId}_batt_level`] = channelObj.levelBatt?.batteryLevel + '%'
							variableObj[`${modelChannelObj.variableId}_batt_cycle`] = channelObj.levelBatt?.batteryCycle
							variableObj[`${modelChannelObj.variableId}_batt_health`] = channelObj.levelBatt?.batteryHealth
							variableObj[`${modelChannelObj.variableId}_batt_timetofull`] =
								channelObj.levelBatt?.batteryTimeToFull?.substring(0, 2) +
								':' +
								channelObj.levelBatt?.batteryTimeToFull?.substring(2, 4)
							variableObj[`${modelChannelObj.variableId}_batt_temp`] = channelObj.levelBatt?.batteryTemp + '°C'
							variableObj[`${modelChannelObj.variableId}_batt_chargestatus`] = channelObj.levelBatt?.batteryChargeStatus
						}
						else {
							variableObj[`${modelChannelObj.variableId}_batt_portstatus`] = ''
							variableObj[`${modelChannelObj.variableId}_batt_level`] = ''
							variableObj[`${modelChannelObj.variableId}_batt_cycle`] = ''
							variableObj[`${modelChannelObj.variableId}_batt_health`] = ''
							variableObj[`${modelChannelObj.variableId}_batt_timetofull`] = ''
							variableObj[`${modelChannelObj.variableId}_batt_temp`] = ''
							variableObj[`${modelChannelObj.variableId}_batt_chargestatus`] = ''
						}

						variableObj[`${modelChannelObj.variableId}_txmute`] = channelObj.txMute ? 'On' : 'Off'
						variableObj[`${modelChannelObj.variableId}_txname`] = channelObj.txName?.replace('*', '')
						variableObj[`${modelChannelObj.variableId}_txlocationname`] = channelObj.txLocationName?.replace(
							'*',
							'',
						)
					}
				}
			}

			this.setVariableValues(variableObj)
		} catch (error) {
			this.log('error', `Error checking variables: ${error.toString()}`)
		}
	},
}
