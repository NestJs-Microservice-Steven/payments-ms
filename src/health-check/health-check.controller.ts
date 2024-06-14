import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealthCheckController {

	@Get()
	healcheck(){
		return 'Payments Webhook is up and RUNING!'
	}
}
