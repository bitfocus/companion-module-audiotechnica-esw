const { InstanceStatus, TCPHelper } = require('@companion-module/base')

module.exports = {
	buildCommand: function (cmd, handshake, params) {
		let self = this

		let builtCmd = ''

		builtCmd +=
			cmd +
			' ' +
			handshake +
			' ' +
			self.CONTROL_MODELID +
			' ' +
			self.CONTROL_UNITNUMBER +
			' ' +
			self.CONTROL_CONTINUESELECT +
			' ' +
			params // +
		//(params == '' ? '' : ' ') //don't send extra space if there are no params

		//console.log('builtCmd: *' + builtCmd + '*')
		builtCmd += self.CONTROL_END

		//console.log('builtCmd: ' + builtCmd);
		return builtCmd
	},

	processError: function (response) {
		let self = this

		let errorReturn = response.split(' ')

		//console.log('response: ' + response)

		let errorCode = parseInt(errorReturn[5])

		//console.log('errorCode: *' + errorCode + '*')

		let errorType = ''

		if (errorCode == 2) {
			//ignore it for now
			return
		}

		switch (errorCode) {
			case 1: // Grammar/Syntax error
				errorType = 'Grammar/Syntax error'
				break
			case 2: // Invalid command
				errorType = 'Invalid command'
				break
			case 3: // Divided Transmission error
				break
			case 4: // Parameter error
				errorType = 'Parameter error'
				break
			case 5: // Transmit timeout
				break
			case 11: // ignore
				//this seems to happen when the device does not having anything in that particular charging port
				//I think the best approach is to reset the data arrays and let the next poll check for the data
				//but only if it was a battery level request
				if (response.includes('glevelbatt')) {
					//clear the levelBatt property frrom the channel based on self.lastReturnedCommand.params
					let channel = self.lastReturnedCommand.params[0]
					let channelObj = self.DATA.channels.find((channelObj) => channelObj.id == channel)
					if (channelObj) {
						channelObj.levelBatt = undefined
					}
				}
				return
			case 61:
				//ignore
				return
			case 62: // Invalid parameter, ignore
				return
			case 90: // Busy
				errorType = 'System is Busy'
				break
			case 92: // Busy (Safe Mode)
				break
			case 93: // Busy (Extension)
				break
			case 99: // Other
				errorType = 'Other error'
				break
			default:
				errorType = 'Unknown error: NAK code ' + errorCode
				break
		}

		self.log('error', `Error: ${response} Error type: ${errorType}`)
	},

	setUpInternalDataArrays: function () {
		let self = this

		let model = self.MODELS.find((model) => model.id == self.config.model)

		if (model.data_request.includes('input_gain_level')) {
			self.DATA.input_gain_levels = []
		}
	},

	initTCP: function () {
		let self = this

		let pipeline = ''

		self.destroy()

		if (self.config.port === undefined) {
			self.config.port = 17200
		}

		if (self.config.host) {
			self.socket = new TCPHelper(self.config.host, self.config.port)

			self.socket.on('error', (err) => {
				self.log('error', 'Network error: ' + err.message)
				self.updateStatus(InstanceStatus.ConnectionFailure)
				clearInterval(self.pollTimer)
				self.socket.destroy()
				self.socket == null
			})

			self.socket.on('connect', () => {
				self.cmdPipe = []

				self.initPolling()

				self.updateStatus(InstanceStatus.Ok)
			})

			self.socket.on('data', (receivebuffer) => {
				pipeline += receivebuffer.toString('utf8')

				if (pipeline.includes(self.CONTROL_ACK)) {
					self.lastReturnedCommand = self.cmdPipeNext()
					// ACKs are sent when a command is received, no processing is needed
					pipeline = ''
				} else if (pipeline.includes(self.CONTROL_NAK)) {
					self.lastReturnedCommand = self.cmdPipeNext()
					// NAKs are sent on error, let's see what error we got
					self.processError(pipeline)
					pipeline = ''
				} else if (pipeline.includes(self.CONTROL_END)) {
					self.lastReturnedCommand = self.cmdPipeNext()
					// Every command ends with CR or an ACK if nothing needed
					let pipeline_responses = pipeline.split(self.CONTROL_END)
					for (let i = 0; i < pipeline_responses.length; i++) {
						if (pipeline_responses[i] !== '') {
							self.processResponse(pipeline_responses[i])
						}
					}

					pipeline = ''
				}
			})
		}
	},

	cmdPipeNext: function () {
		let self = this

		const return_cmd = self.cmdPipe.shift()

		if (self.cmdPipe.length > 0) {
			let command = self.cmdPipe[0]
			self.runCommand(command.cmd, command.handshake, command.params)
		}

		return return_cmd
	},

	sendCommand: function (cmd, handshake, params) {
		let self = this

		if (cmd !== undefined) {
			self.cmdPipe.push({
				cmd: cmd,
				handshake: handshake,
				params: params,
			})

			if (self.cmdPipe.length === 1) {
				self.runCommand(cmd, handshake, params)
			}
		}
	},

	runCommand: function (cmd, handshake, params) {
		let self = this

		if (self.socket !== undefined && self.socket.isConnected) {
			console.log('sending: ' + self.buildCommand(cmd, handshake, params))
			self.socket
				.send(self.buildCommand(cmd, handshake, params))
				.then((result) => {
					//console.log('send result: ' + result)
				})
				.catch((error) => {
					console.log('send error: ' + error)
				})
		} else {
			self.log('error', 'Network error: Connection to Device not opened.')
			clearInterval(self.pollTimer)
		}
	},

	processResponse: function (response) {
		let self = this

		let category = 'XXX'
		let args = []
		let params = ''

		//args = response.split(' ')
		args = response.match(/\\?.|^$/g).reduce(
			(p, c) => {
				if (c === '"') {
					p.quote ^= 1
				} else if (!p.quote && c === ' ') {
					p.a.push('')
				} else {
					p.a[p.a.length - 1] += c.replace(/\\(.)/, '$1')
				}
				return p
			},
			{ a: [''] },
		).a

		if (args.length >= 1) {
			category = args[0].trim().toLowerCase()
		}

		if (args.length >= 5) {
			params = args[4]
		}

		params = params.split(',')

		let channelObj = {}

		switch (category) {
			//common data
			case 'gmyname':
				self.DATA.deviceName = params[0]
				break
			case 'gmydeviceid':
				self.DATA.deviceId = params[0]
				break
			case 'glocationname':
				self.DATA.locationName = params[0]
				break
			case 'gpresetname':
				self.DATA.presetNames[parseInt(params[0]) - 1] = params[1]
				break
			case 'grmgpresetname':
				self.DATA.roamingPresetNames[parseInt(params[0]) - 1] = params[1]
				break
			case 'glastpreset':
				self.DATA.lastPreset = params[0]
				break

			//channel specific data
			case 'gchname':
				channelObj.id = params[0]
				channelObj.name = params[1]
				break
			case 'gchmute':
				channelObj.id = params[0]
				channelObj.mute = params[1] == '1' ? true : false
				break
			case 'gchvolume':
				channelObj.id = params[0]
				channelObj.volume = params[1]
				break
			case 'gchhpf':
				channelObj.id = params[0]
				channelObj.hpf = params[1]
				break
			case 'gtxmicgain':
				channelObj.id = params[0]
				channelObj.txMicGain = params[1]
				break
			case 'gtxintmicgain':
				channelObj.id = params[0]
				channelObj.txIntMicGain = params[1]
				break
			case 'gtxmicpolar':
				channelObj.id = params[0]
				channelObj.txMicPolarity = params[1]
				break
			case 'gtxforcedmute':
				channelObj.id = params[0]
				channelObj.txForcedMute = params[1] == '1' ? true : false
				break
			case 'glevelrf':
				channelObj.id = params[0]
				channelObj.levelRF = params[1]
				break
			case 'glevelafrx':
				channelObj.id = params[0]
				channelObj.levelAFRX = params[1]
				break
			case 'glevelbatttx':
				channelObj.id = params[0]
				channelObj.levelBattTx = {
					linkStatus: params[1],
					batteryLevel: params[2],
					batteryLife: params[3],
					usbChargingStatus: params[4],
				}
				break
			case 'glevelbatt':
				channelObj.id = params[0]
				channelObj.levelBatt = {
					portStatus: params[1],
					batteryLevel: params[2],
					batteryCycle: params[3],
					batteryHealth: params[4],
					batteryTimeToFull: params[5],
					batteryTemp: params[6],
					batteryChargeStatus: params[7],
				}
				break
			case 'gstsmute':
				channelObj.id = params[0]
				channelObj.stsMute = {
					chMute: parseInt(params[1]) == 1 ? true : false,
					txMute: parseInt(params[2]) == 1 ? true : false,
				}
				break
			case 'gtxname':
				channelObj.id = params[0]
				channelObj.txName = params[1]
				break
			case 'gtxlocationname':
				channelObj.id = params[0]
				channelObj.txLocationName = params[1]
				break
		}

		let found = false

		for (let i = 0; i < self.DATA.channels.length; i++) {
			if (self.DATA.channels[i].id == channelObj.id) {
				self.DATA.channels[i] = { ...self.DATA.channels[i], ...channelObj }
				found = true
				break
			}
		}

		if (!found) {
			self.DATA.channels.push(channelObj)
		}

		self.checkFeedbacks()
		self.checkVariables()
	},

	initPolling: function () {
		let self = this

		if (self.pollTimer === undefined && self.config.poll_interval > 0) {
			self.pollTimer = setInterval(() => {
				let model = self.MODELS.find((model) => model.id == self.config.model)

				if (model) {
					//grab specific data requests as per model
					if (model.data_request.includes('gmyname')) {
						self.sendCommand('gmyname', 'O', '')
					}

					if (model.data_request.includes('gmydeviceid')) {
						self.sendCommand('gmydeviceid', 'O', '')
					}

					if (model.data_request.includes('glocationname')) {
						self.sendCommand('glocationname', 'O', '')
					}

					if (model.data_request.includes('gpresetname')) {
						for (let i = 1; i <= 8; i++) {
							self.sendCommand('gpresetname', 'O', i.toString())
						}
					}

					if (model.data_request.includes('grmgpresetname')) {
						for (let i = 1; i <= 8; i++) {
							self.sendCommand('grmgpresetname', 'O', i.toString())
						}
					}

					if (model.data_request.includes('glastpreset')) {
						self.sendCommand('glastpreset', 'O', '')
					}

					if (model.data_request.includes('gchname')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gchname', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gchmute')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gchmute', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gchvolume')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gchvolume', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gchhpf')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gchhpf', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxmicgain')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gtxmicgain', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxintmicgain')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gtxintmicgain', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxmicpolar')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gtxmicpolar', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxforcedmute')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gtxforcedmute', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelrf')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('glevelrf', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelafrx')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('glevelafrx', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelbatttx')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('glevelbatttx', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelbatt')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('glevelbatt', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gstsmute')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gstsmute', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxname')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gtxname', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxlocationname')) {
						for (let i = 0; i < model.channels.length; i++) {
							self.sendCommand('gtxlocationname', 'O', model.channels[i].id)
						}
					}
				}
			}, self.config.poll_interval)
		}
	},
}
