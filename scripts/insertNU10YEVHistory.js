/**
 * Manually insert NU10YEV history data from API response
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const VehicleHistory = require('../models/VehicleHistory');

async function insertHistory() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const vrm = 'NU10YEV';
    
    // Delete existing history for this VRM
    console.log(`Deleting existing history for ${vrm}...`);
    const deleteResult = await VehicleHistory.deleteMany({ vrm: vrm });
    console.log(`Deleted ${deleteResult.deletedCount} existing records\n`);

    // Create history record with parsed data
    const historyData = {
      vrm: 'NU10YEV',
      checkDate: new Date(),
      hasAccidentHistory: false,
      isStolen: false,
      hasOutstandingFinance: false,
      isScrapped: false,
      isImported: false,
      isExported: false,
      isWrittenOff: false,
      numberOfPreviousKeepers: 7,
      previousOwners: 7,
      numberOfOwners: 7,
      numberOfKeys: 1,
      keys: 1,
      serviceHistory: 'Contact seller',
      motStatus: null,
      motExpiryDate: null,
      checkStatus: 'success',
      apiProvider: 'CheckCarDetails',
      testMode: false,
      v5cCertificateCount: 2,
      v5cCertificateList: [
        { certificateDate: new Date('2019-04-15T00:00:00') },
        { certificateDate: new Date('2018-12-12T00:00:00') }
      ],
      plateChanges: 0,
      plateChangesList: [],
      colourChanges: 0,
      colourChangesList: [],
      colourChangeDetails: {
        currentColour: 'RED',
        originalColour: 'RED',
        numberOfPreviousColours: 0,
        lastColour: null,
        dateOfLastColourChange: null
      },
      keeperChangesList: [
        {
          dateOfTransaction: new Date('2019-04-09T00:00:00'),
          numberOfPreviousKeepers: 7,
          dateOfLastKeeperChange: new Date('2019-04-09T00:00:00')
        },
        {
          dateOfTransaction: new Date('2018-12-02T00:00:00'),
          numberOfPreviousKeepers: 6,
          dateOfLastKeeperChange: new Date('2018-12-02T00:00:00')
        },
        {
          dateOfTransaction: new Date('2018-10-17T00:00:00'),
          numberOfPreviousKeepers: 5,
          dateOfLastKeeperChange: new Date('2018-10-17T00:00:00')
        },
        {
          dateOfTransaction: new Date('2014-02-17T00:00:00'),
          numberOfPreviousKeepers: 4,
          dateOfLastKeeperChange: new Date('2014-02-17T00:00:00')
        },
        {
          dateOfTransaction: new Date('2013-11-13T00:00:00'),
          numberOfPreviousKeepers: 3,
          dateOfLastKeeperChange: new Date('2013-11-13T00:00:00')
        },
        {
          dateOfTransaction: new Date('2013-10-14T00:00:00'),
          numberOfPreviousKeepers: 2,
          dateOfLastKeeperChange: new Date('2013-10-14T00:00:00')
        },
        {
          dateOfTransaction: new Date('2010-11-15T00:00:00'),
          numberOfPreviousKeepers: 1,
          dateOfLastKeeperChange: new Date('2010-11-15T00:00:00')
        }
      ],
      vicCount: 0,
      accidentDetails: {
        count: 0,
        severity: 'unknown',
        dates: []
      },
      stolenDetails: {
        status: 'active'
      },
      financeDetails: {
        amount: 0,
        lender: 'Unknown',
        type: 'unknown'
      }
    };

    console.log('Inserting history data...');
    const history = new VehicleHistory(historyData);
    await history.save();

    console.log('\n✅ History data inserted successfully!\n');
    console.log('📊 Inserted Data:');
    console.log('  VRM:', history.vrm);
    console.log('  Number of Previous Keepers:', history.numberOfPreviousKeepers);
    console.log('  V5C Certificate Count:', history.v5cCertificateCount);
    console.log('  V5C Certificate List:', history.v5cCertificateList);
    console.log('  Keeper Changes List Length:', history.keeperChangesList?.length || 0);
    console.log('  Plate Changes:', history.plateChanges);
    console.log('  Colour Changes:', history.colourChanges);
    
    // Verify
    const dbRecord = await VehicleHistory.findOne({ vrm: vrm }).lean();
    if (dbRecord && dbRecord.numberOfPreviousKeepers === 7) {
      console.log('\n✅ SUCCESS: Data verified in database - owner count is 7');
    } else {
      console.log('\n❌ ERROR: Data verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

insertHistory();
