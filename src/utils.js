const { InstanceStatus, TCPHelper } = require('@companion-module/base')

module.exports = {
	buildCommand(cmd, handshake, params) {
		let builtCmd = ''

		builtCmd +=
			cmd +
			' ' +
			handshake +
			' ' +
			this.CONTROL_MODELID +
			' ' +
			this.CONTROL_UNITNUMBER +
			' ' +
			this.CONTROL_CONTINUESELECT +
			' ' +
			params +
			' ' +
			this.CONTROL_END

		//console.log('builtCmd: ' + builtCmd);
		return builtCmd
	},

	processError(response) {
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

		this.log('error', `Error: ${response} Error type: ${errorType}`)
	},

	setUpInternalDataArrays() {
		let model = this.MODELS.find((model) => model.id == this.config.model)

		if (model.data_request.includes('input_gain_level')) {
			this.DATA.input_gain_levels = []
		}
	},

	initTCP() {
		let pipeline = ''

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.port === undefined) {
			this.config.port = 17200
		}

		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.log('error', 'Network error: ' + err.message)
				this.updateStatus(InstanceStatus.ConnectionFailure)
				clearInterval(this.pollTimer)
				this.socket.destroy()
				this.socket == null
			})

			this.socket.on('connect', () => {
				self.cmdPipe = []

				this.initPolling()

				this.updateStatus(InstanceStatus.Ok)
			})

			this.socket.on('data', (receivebuffer) => {
				pipeline += receivebuffer.toString('utf8')

				//this whole area needs work because I think ACKs are sent on good response as well as a request for data

				if (pipeline.includes(this.CONTROL_ACK)) {
					// ACKs are sent when a command is received, no processing is needed
					pipeline = ''
				} else if (pipeline.includes(this.CONTROL_NAK)) {
					// NAKs are sent on error, let's see what error we got
					this.processError(pipeline)
					pipeline = ''
				} else if (pipeline.includes(this.CONTROL_END)) {
					// Every command ends with CR or an ACK if nothing needed
					let pipeline_responses = pipeline.split(this.CONTROL_END)
					for (let i = 0; i < pipeline_responses.length; i++) {
						if (pipeline_responses[i] !== '') {
							this.processResponse(pipeline_responses[i])
						}
					}

					pipeline = ''
				}

				self.lastReturnedCommand = self.cmdPipeNext()
			})
		}
	},

	cmdPipeNext() {
		let self = this

		const return_cmd = self.cmdPipe.shift()

		if (self.cmdPipe.length > 0) {
			let command = self.cmdPipe[0]
			self.runCommand(command.cmd, command.handshake, command.params)
		}

		return return_cmd
	},

	sendCommand(cmd, handshake, params) {
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

	runCommand(cmd, handshake, params) {
		let self = this

		if (self.socket !== undefined && self.socket.isConnected) {
			console.log('sending: ' + self.buildCommand(cmd, handshake, params))
			self.socket
				.send(self.buildCommand(cmd, handshake, params))
				.then((result) => {
					//console.log('send result: ' + result);
				})
				.catch((error) => {
					//console.log('send error: ' + error);
				})
		} else {
			self.log('error', 'Network error: Connection to Device not opened.')
			clearInterval(self.pollTimer)
		}
	},

	processResponse(response) {
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
				this.DATA.deviceName = params[0]
				break
			case 'gmydeviceid':
				this.DATA.deviceId = params[0]
				break
			case 'glocationname':
				this.DATA.locationName = params[0]
				break
			case 'gpresetname':
				this.DATA.presetNames[parseInt(params[0]) - 1] = params[1]
				break
			case 'grmgpresetname':
				this.DATA.roamingPresetNames[parseInt(params[0]) - 1] = params[1]
				break
			case 'glastpreset':
				this.DATA.lastPreset = params[0]
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

		for (let i = 0; i < this.DATA.channels.length; i++) {
			if (this.DATA.channels[i].id == channelObj.id) {
				channels[i] = { ...channels[i], ...channelObj }
				found = true
				break
			}
		}

		if (!found) {
			this.DATA.channels.push(channelObj)
		}

		this.checkFeedbacks()
		this.checkVariables()
	},

	initPolling() {
		if (this.pollTimer === undefined && this.config.poll_interval > 0) {
			this.pollTimer = setInterval(() => {
				let model = this.MODELS.find((model) => model.id == this.config.model)

				if (model) {
					//grab specific data requests as per model
					if (model.data_request.includes('gmyname')) {
						this.sendCommand('gmyname', 'O', '')
					}

					if (model.data_request.includes('gmydeviceid')) {
						this.sendCommand('gmydeviceid', 'O', '')
					}

					if (model.data_request.includes('glocationname')) {
						this.sendCommand('glocationname', 'O', '')
					}

					if (model.data_request.includes('gpresetname')) {
						for (let i = 1; i <= 8; i++) {
							this.sendCommand('gpresetname', 'O', i.toString())
						}
					}

					if (model.data_request.includes('grmgpresetname')) {
						for (let i = 1; i <= 8; i++) {
							this.sendCommand('grmgpresetname', 'O', i.toString())
						}
					}

					if (model.data_request.includes('glastpreset')) {
						this.sendCommand('glastpreset', 'O', '')
					}

					if (model.data_request.includes('gchname')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gchname', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gchmute')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gchmute', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gchvolume')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gchvolume', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gchhpf')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gchhpf', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxmicgain')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gtxmicgain', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxintmicgain')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gtxintmicgain', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxmicpolar')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gtxmicpolar', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxforcedmute')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gtxforcedmute', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelrf')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('glevelrf', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelafrx')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('glevelafrx', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelbatttx')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('glevelbatttx', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('glevelbatt')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('glevelbatt', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gstsmute')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gstsmute', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxname')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gtxname', 'O', model.channels[i].id)
						}
					}

					if (model.data_request.includes('gtxlocationname')) {
						for (let i = 0; i < model.channels.length; i++) {
							this.sendCommand('gtxlocationname', 'O', model.channels[i].id)
						}
					}
				}
			}, this.config.poll_interval)
		}
	},
}
