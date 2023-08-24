import commonMiddleware from '../lib/commonMiddleware';
// import createError from 'http-errors';
// import validator from '@middy/validator';
import cors from '@middy/http-cors';
import crypto from 'crypto';
// import { uploadCountries } from '../lib/uploadCountries';
import { uploadDestinations } from '../lib/uploadDestinations';
// import { uploadRooms } from '../lib/uploadRooms';
// import { uploadBoards } from '../lib/uploadBoards';
// import { uploadAccommodations } from '../lib/uploadAccommodations';
// import { uploadCategories } from '../lib/uploadCategories';
// import { uploadChains } from '../lib/uploadChains';
// import { uploadFacilities } from '../lib/uploadFacilities';
// import { uploadFacilityGroups } from '../lib/uploadFacilityGroups';
// import { uploadIssues } from '../lib/uploadIssues';
// import { uploadLanguages } from '../lib/uploadLanguages';
// import { uploadPromotions } from '../lib/uploadPromotions';
// import { uploadSegments } from '../lib/uploadSegments';
// import { uploadImages } from '../lib/uploadImages';
// const s3 = new AWS.S3();

async function uploadHotelsInfo(event, context) {
  const hash = crypto.createHash('sha256');
  const encryption =
    process.env.APITUDE_APIKEY +
    process.env.APITUDE_SECRET +
    Math.floor(Date.now() / 1000);

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Api-key': process.env.APITUDE_APIKEY,
      'X-Signature': `${hash.update(encryption).digest('hex')}`,
    },
  };

  // uploadCountries(config);
  uploadDestinations(config);
  // uploadRooms(config);
  // uploadBoards(config);
  // uploadAccommodations(config);
  // uploadCategories(config);
  // uploadChains(config);
  // uploadFacilities(config);
  // uploadFacilityGroups(config);
  // uploadIssues(config);
  // uploadLanguages(config);
  // uploadPromotions(config);
  // uploadSegments(config);
  // uploadImages(config);
}

export const handler = commonMiddleware(uploadHotelsInfo).use(cors());
