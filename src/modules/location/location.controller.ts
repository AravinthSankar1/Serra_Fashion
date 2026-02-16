import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';
import { Country, State, City } from 'country-state-city';

export const getAllCountries = asyncHandler(async (req: Request, res: Response) => {
    const countries = Country.getAllCountries().map(country => ({
        code: country.isoCode,
        name: country.name,
        phoneCode: country.phonecode,
        currency: country.currency,
        flag: country.flag
    }));

    res.status(200).json(ApiResponse.success(countries));
});

export const getStatesByCountry = asyncHandler(async (req: Request, res: Response) => {
    const { countryCode } = req.params;

    const states = State.getStatesOfCountry(countryCode).map(state => ({
        code: state.isoCode,
        name: state.name,
        latitude: state.latitude,
        longitude: state.longitude
    }));

    res.status(200).json(ApiResponse.success(states));
});

export const getCitiesByState = asyncHandler(async (req: Request, res: Response) => {
    const { countryCode, stateCode } = req.params;

    const cities = City.getCitiesOfState(countryCode, stateCode).map(city => ({
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude
    }));

    res.status(200).json(ApiResponse.success(cities));
});
