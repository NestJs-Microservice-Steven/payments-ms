import { Inject, Injectable, Logger, Post } from '@nestjs/common';
import { NATS_SERVICE, envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

	private readonly logger = new Logger('PaymentService');
	private readonly stripe = new Stripe(
		envs.stripeSecret
	);

	constructor(
		@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy
	){}


	async createPaymentSession(paymentSessionDto: PaymentSessionDto){

		const { currency, items, orderId } = paymentSessionDto

		const lineItems = items.map( item => {

			return {
				price_data: {
					currency: currency,
					product_data: {
						name: item.name
					},
					unit_amount: Math.round( item.price * 100 )
				},
				quantity: item.quantity
			}

		})


		
		const session = await this.stripe.checkout.sessions.create({

			// COLOCAR qui el ID de mi orden
			payment_intent_data: {
				metadata: {
					orderId
				}
			},

			line_items: lineItems,
			mode: 'payment',
			success_url: envs.stripeSuccessUrl,
			cancel_url: envs.stripeCancelUrl

		});

		//return session; para no retornar mas data de la necesaria
		return {
			cancelUrl: session.cancel_url,
			successUrl: session.success_url,
			url: session.url
		}

	}

	@Post('weebhook')
	async stripeWebHook( req: Request, res?: Response){
		const sig = req.headers['stripe-signature']
		let event: Stripe.Event
		// TEST const endpointSecret = "whsec_013dd65a0c384b32dc9363476fe61142d3cd60215da6364f6c67b4bd2efb6b37"
		const endpointSecret = envs.stripeEndpointSecret

		try{
			event = this.stripe.webhooks.constructEvent(
				req['rawBody'],
				sig,
				endpointSecret,
			);
		}catch (err) {

			res?.status(400).send(`Webhook Error: ${err.message}`)
			return;
		}

		switch(event.type) {
			case 'charge.succeeded':
				const chargeSucceeded = event.data.object
				const payload = {
					stripePaymentId: chargeSucceeded.id,
					orderId: chargeSucceeded.metadata.orderId,
					receiptUrl: chargeSucceeded.receipt_url
				}
				// TODO: LLAMAR A NUESTRO MICROSERVICIO
				//console.log({payload})
				this.natsClient.emit('payment.succeeded', payload)
			break;

			default:
				console.log(`Evento ${ event.type} not handled`)
		}

	
	}


}