import { Router } from 'express';
import * as currencyController from './currency.controller';

const router = Router();

router.get('/rates', currencyController.getExchangeRates);
router.get('/supported', currencyController.getSupportedCurrencies);
router.get('/convert', currencyController.convertCurrency);

export default router;
