// Export all models from a single file
module.exports = {
  User: require('./User'),
  Car: require('./Car'),
  Bike: require('./Bike'),
  VehicleHistory: require('./VehicleHistory'),
  AdvertisingPackagePurchase: require('./AdvertisingPackagePurchase'),
  // Trade Subscription Models
  TradeDealer: require('./TradeDealer'),
  SubscriptionPlan: require('./SubscriptionPlan'),
  TradeSubscription: require('./TradeSubscription'),
  Van: require('./Van'),
  // Stock Feed Import Models
  DealerFeed: require('./DealerFeed'),
  FeedVehicle: require('./FeedVehicle'),
  FeedImage: require('./FeedImage'),
  FeedLog: require('./FeedLog')
};
