import { Injectable, Post } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {

	private readonly stripe = new Stripe(
		envs.stripeSecret
	);


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

		return session;

	}

	@Post('weebhook')
	async stripeWebHook( req: Request, res?: Response){
		const sig = req.headers['stripe-signature']
		let event: Stripe.Event
		// TEST const endpointSecret = "whsec_013dd65a0c384b32dc9363476fe61142d3cd60215da6364f6c67b4bd2efb6b37"
		const endpointSecret = envs.stripeEndPointSecret

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
				// TODO: LLAMAR A NUESTRO MICROSERVICIO
				console.log({
					metadata: chargeSucceeded.metadata,
					orderId: chargeSucceeded.metadata.orderId // si solo queremos enviar el ID y no toda la meta data
				})
			break;

			default:
				console.log(`Evento ${ event.type} not handled`)
		}

	
	}


}
