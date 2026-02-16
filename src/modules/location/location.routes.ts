import { Router } from 'express';
import * as locationController from './location.controller';

const router = Router();

router.get('/countries', locationController.getAllCountries);
router.get('/states/:countryCode', locationController.getStatesByCountry);
router.get('/countries/:countryCode/states', locationController.getStatesByCountry);
router.get('/countries/:countryCode/states/:stateCode/cities', locationController.getCitiesByState);

export default router;
