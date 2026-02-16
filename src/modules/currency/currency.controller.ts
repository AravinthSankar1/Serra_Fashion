import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';
import { currencyService } from '../../services/currency.service';
import { SUPPORTED_CURRENCIES } from '../../config/currency';

export const getExchangeRates = asyncHandler(async (req: Request, res: Response) => {
    const rates = await currencyService.getExchangeRates();
    res.status(200).json(ApiResponse.success(rates));
});

export const getSupportedCurrencies = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(ApiResponse.success(SUPPORTED_CURRENCIES));
});

export const convertCurrency = asyncHandler(async (req: Request, res: Response) => {
    const { amount, from, to } = req.query;

    const converted = await currencyService.convert(
        parseFloat(amount as string),
        (from as string).toUpperCase(),
        (to as string).toUpperCase()
    );

    res.status(200).json(ApiResponse.success({
        amount: parseFloat(amount as string),
        from,
        to,
        converted,
        formatted: currencyService.formatCurrency(converted, (to as string).toUpperCase())
    }));
});
