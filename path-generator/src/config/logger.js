

import { createLogger } from 'omnilogs'

const logger = createLogger({
	serviceName: 'path-generator',
	level: 'info',
	transports: {
		console: {
			type: 'detailed'
		}
	}
})

export default logger;