import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession(@Body() paymentSessionDto :PaymentSessionDto){
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }


  @Get('success')
  success(){
    return{
      ok: true,
      message: 'Payment Successfull'
    }
  }

  @Get('cancel')
  cancel(){
    return{
      ok: false,
      message: 'Payment Canceled'
    }
  }

  @Post('webhook')
    async stripeWebhook(@Req() req: Request, res: Response) {
      return this.paymentsService.stripeWebHook(req, res)
    }



  }




