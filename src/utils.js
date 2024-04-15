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
			params +
			' ' +
			self.CONTROL_END

		//console.log('builtCmd: ' + builtCmd);
		return builtCmd
	},

	processError: function (response) {
		let self = this

		let errorReturn = response.split(' ')

		let errorCode = errorReturn[2]

		let errorType = ''

		switch (errorCode) {
			case '01': // Grammar error
				break
			case '02': // Invalid command
				break
			case '03': // Divided Transmission error
				break
			case '04': // Parameter error
				errorType = 'Parameter error'
				break
			case '05': // Transmit timeout
				break
			case '90': // Busy
				break
			case '92': // Busy (Safe Mode)
				break
			case '93': // Busy (Extension)
				break
			case '99': // Other
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

		if (self.socket !== undefined) {
			self.socket.destroy()
			delete self.socket
		}

		if (self.config.port === undefined) {
			self.config.port = 17200
		}

		if (self.config.host) {
			self.socket = new TCPHelper(self.config.host, self.config.port)

			self.socket.on('status_change', (status, message) => {
				self.updateStatus(status, message)
			})

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

				//this whole area needs work because I think ACKs are sent on good response as well as a request for data

				if (pipeline.includes(self.CONTROL_ACK)) {
					// ACKs are sent when a command is received, no processing is needed
					pipeline = ''
				} else if (pipeline.includes(self.CONTROL_NAK)) {
					// NAKs are sent on error, let's see what error we got
					self.processError(pipeline)
					pipeline = ''
				} else if (pipeline.includes(self.CONTROL_END)) {
					// Every command ends with CR or an ACK if nothing needed
					let pipeline_responses = pipeline.split(self.CONTROL_END)
					for (let i = 0; i < pipeline_responses.length; i++) {
						if (pipeline_responses[i] !== '') {
							self.processResponse(pipeline_responses[i])
						}
					}

					pipeline = ''
				}

				self.lastReturnedCommand = self.cmdPipeNext()
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
					console.log('send result: ' + result)
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
			{ a: [''] }
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
					chMute: params[1] == '1' ? true : false,
					txMute: params[2] == '1' ? true : false,
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
